import asyncio
import signal
import time
from functools import partial

import aio_pika
import aio_pika.abc
import structlog
from prometheus_client import Counter, Gauge, start_http_server
from sqlalchemy.dialects.postgresql import insert as pg_insert

from database.db_helper import db_helper
from features.notifications.broker import broker
from features.notifications.consumer_bindings import (
    BINDINGS,
    BINDINGS_BY_ROUTING_KEY,
    EventBinding,
)
from features.notifications.events import NotificationEvent, UserNotificationMessage
from features.notifications.handlers import publish_user_notification
from features.notifications.processed_event import ProcessedEvent
from settings.config.app_config import settings
from utils.logging_setup import configure_logging, get_logger

logger = get_logger(__name__)

_MAX_MESSAGE_BYTES = 64 * 1024
_MAX_RETRIES = 5
_DRAIN_TIMEOUT_SECONDS = 30.0

worker_events_processed_total = Counter(
    "worker_events_processed_total",
    "Total events successfully processed by the notifications worker",
    ["routing_key"],
)
worker_events_failed_total = Counter(
    "worker_events_failed_total",
    "Total events that failed processing in the notifications worker",
    ["routing_key", "reason"],
)
worker_broker_connected = Gauge(
    "worker_broker_connected",
    "Whether the notifications worker is connected to RabbitMQ (1) or not (0)",
)
worker_last_message_timestamp = Gauge(
    "worker_last_message_timestamp_seconds",
    "Unix timestamp of the last message the notifications worker handled",
)


def _record_failure(routing_key: str, reason: str) -> None:
    worker_events_failed_total.labels(routing_key=routing_key, reason=reason).inc()


def retry_count(message: aio_pika.abc.AbstractIncomingMessage) -> int:
    raw = (message.headers or {}).get("x-retry-count", 0)
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str | bytes):
        try:
            return int(raw)
        except ValueError:
            return 0
    return 0


async def send_to_retry(
    message: aio_pika.abc.AbstractIncomingMessage, routing_key: str, attempt: int
) -> None:
    retry_message = aio_pika.Message(
        body=message.body,
        content_type=message.content_type,
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        headers={**(message.headers or {}), "x-retry-count": attempt},
    )
    await broker.retry_exchange.publish(retry_message, routing_key=routing_key)


async def handle_event(
    binding: EventBinding[NotificationEvent],
    event: NotificationEvent,
    routing_key: str,
) -> UserNotificationMessage | None:
    async with db_helper.session_factory() as session:
        insert_stmt = (
            pg_insert(ProcessedEvent)
            .values(event_id=event.event_id, routing_key=routing_key)
            .on_conflict_do_nothing(index_elements=["event_id"])
            .returning(ProcessedEvent.event_id)
        )
        claimed = (await session.execute(insert_stmt)).scalar_one_or_none()
        if claimed is None:
            await session.rollback()
            logger.info(
                "duplicate_event_skipped",
                routing_key=routing_key,
                event_id=str(event.event_id),
            )
            return None
        await binding.dispatch(session, event)
        staged = session.info.get("notification_payload")
        await session.commit()
        return staged if isinstance(staged, UserNotificationMessage) else None


async def parse_message_event(
    message: aio_pika.abc.AbstractIncomingMessage,
    binding: EventBinding[NotificationEvent],
    routing_key: str,
) -> NotificationEvent | None:
    if len(message.body) > _MAX_MESSAGE_BYTES:
        logger.error("message_too_large", routing_key=routing_key, size=len(message.body))
        _record_failure(routing_key, "too_large")
        await message.nack(requeue=False)
        return None
    try:
        return binding.decode(message.body)
    except Exception:
        logger.exception("message_process_failed", routing_key=routing_key)
        _record_failure(routing_key, "invalid_payload")
        await message.nack(requeue=False)
        return None


async def retry_or_dead_letter(
    message: aio_pika.abc.AbstractIncomingMessage,
    routing_key: str,
) -> None:
    attempt = retry_count(message) + 1
    if attempt > _MAX_RETRIES:
        logger.exception("message_dead_lettered", routing_key=routing_key, attempts=attempt)
        _record_failure(routing_key, "max_retries_exceeded")
        await message.nack(requeue=False)
        return
    logger.exception(
        "message_process_failed_retrying",
        routing_key=routing_key,
        attempt=attempt,
    )
    _record_failure(routing_key, "handler_error")
    await send_to_retry(message, routing_key, attempt)
    await message.ack()


async def process_message(
    message: aio_pika.abc.AbstractIncomingMessage,
    routing_key: str,
) -> None:
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(routing_key=routing_key)
    async with message.process(requeue=False, ignore_processed=True):
        worker_last_message_timestamp.set(time.time())
        binding = BINDINGS_BY_ROUTING_KEY.get(routing_key)
        if binding is None:
            logger.error("no_handler_registered", routing_key=routing_key)
            _record_failure(routing_key, "no_handler")
            await message.nack(requeue=False)
            return
        domain_event = await parse_message_event(message, binding, routing_key)
        if domain_event is None:
            return
        structlog.contextvars.bind_contextvars(event_id=str(domain_event.event_id))
        try:
            payload = await handle_event(binding, domain_event, routing_key)
        except Exception:
            await retry_or_dead_letter(message, routing_key)
            return

        worker_events_processed_total.labels(routing_key=routing_key).inc()
        if payload is not None:
            await publish_user_notification(payload)


def install_signal_handlers(stop_event: asyncio.Event) -> None:
    loop = asyncio.get_running_loop()

    def _handle_stop() -> None:
        logger.info("consumer_shutdown_signal")
        stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _handle_stop)
        except NotImplementedError:
            signal.signal(sig, lambda _signum, _frame: _handle_stop())


async def start_consuming() -> None:
    from features.notifications.outbox_service import run_outbox_publisher

    stop_event = asyncio.Event()
    install_signal_handlers(stop_event)

    await broker.connect()
    worker_broker_connected.set(1)
    outbox_task = asyncio.create_task(run_outbox_publisher(stop_event=stop_event))

    channel = broker.channel
    exchange = broker.exchange
    consumers: list[tuple[aio_pika.abc.AbstractQueue, str]] = []

    for binding in BINDINGS:
        queue = await channel.declare_queue(
            binding.queue_name,
            durable=True,
            arguments={"x-dead-letter-exchange": "foodize.dlx"},
        )
        await queue.bind(exchange, routing_key=binding.routing_key)
        consumer_tag = await queue.consume(
            partial(process_message, routing_key=binding.routing_key)
        )
        consumers.append((queue, consumer_tag))
        logger.info("consuming_queue", queue=binding.queue_name, routing_key=binding.routing_key)

    logger.info("worker_started")
    await stop_event.wait()
    logger.info("worker_stopping")

    for queue, consumer_tag in consumers:
        try:
            await queue.cancel(consumer_tag)
        except Exception:
            logger.exception("consumer_cancel_failed", queue=queue.name)

    try:
        await asyncio.wait_for(outbox_task, timeout=_DRAIN_TIMEOUT_SECONDS)
    except TimeoutError:
        logger.warning("outbox_drain_timeout")
        outbox_task.cancel()


def _start_metrics_server() -> None:
    port = settings.rabbitmq.worker_metrics_port
    start_http_server(port)
    logger.info("worker_metrics_server_started", port=port)


async def main() -> None:
    configure_logging()
    _start_metrics_server()
    try:
        await start_consuming()
    finally:
        worker_broker_connected.set(0)
        await broker.disconnect()
