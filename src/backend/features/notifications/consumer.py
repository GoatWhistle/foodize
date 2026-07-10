import asyncio
import logging
import signal
from collections.abc import Awaitable, Callable
from functools import partial
from typing import Any

import aio_pika
import aio_pika.abc
from pydantic import BaseModel

from features.notifications.broker import broker
from features.notifications.events import OrderPlacedEvent, OrderStatusChangedEvent
from features.notifications.handlers import (
    handle_order_placed,
    handle_order_status_changed,
)
from features.notifications.outbox_service import run_outbox_publisher
from infra.cache.redis import get_redis_cache

logger = logging.getLogger(__name__)

_MAX_MESSAGE_BYTES = 64 * 1024
_DEDUP_TTL_SECONDS = 86_400

_BINDINGS: list[tuple[str, str, Callable[[Any], Awaitable[None]]]] = [
    ("notifications.order.placed", "order.placed", handle_order_placed),
    (
        "notifications.order.status_changed",
        "order.status_changed",
        handle_order_status_changed,
    ),
]

_EVENT_MODELS: dict[str, type[BaseModel]] = {
    "order.placed": OrderPlacedEvent,
    "order.status_changed": OrderStatusChangedEvent,
}


async def _process_message(
    message: aio_pika.abc.AbstractIncomingMessage,
    routing_key: str,
) -> None:
    async with message.process(requeue=False, ignore_processed=True):
        model_cls = _EVENT_MODELS.get(routing_key)
        binding = next((b for b in _BINDINGS if b[1] == routing_key), None)
        if model_cls is None or binding is None:
            logger.error("No handler registered for routing_key=%s", routing_key)
            await message.nack(requeue=False)
            return
        if len(message.body) > _MAX_MESSAGE_BYTES:
            logger.error(
                "Message too large (routing_key=%s size=%d)", routing_key, len(message.body)
            )
            await message.nack(requeue=False)
            return
        try:
            event = model_cls.model_validate_json(message.body)
            if not await _claim_event(event.event_id):
                logger.info(
                    "Skipping duplicate event (routing_key=%s event_id=%s)",
                    routing_key,
                    event.event_id,
                )
                return
            await binding[2](event)
        except Exception:
            logger.exception("Failed to process message (routing_key=%s)", routing_key)
            await message.nack(requeue=False)


async def _claim_event(event_id) -> bool:
    redis = get_redis_cache()
    return await redis.set_nx(f"evt:{event_id}", "1", ttl=_DEDUP_TTL_SECONDS)


_background_tasks: set[asyncio.Task] = set()


def _install_signal_handlers(stop_event: asyncio.Event) -> None:
    loop = asyncio.get_running_loop()

    def _handle_stop() -> None:
        logger.info("Shutdown signal received, stopping consumer...")
        stop_event.set()

    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _handle_stop)
        except NotImplementedError:
            signal.signal(sig, lambda signum, frame: _handle_stop())


async def start_consuming() -> None:
    stop_event = asyncio.Event()
    _install_signal_handlers(stop_event)

    await broker.connect()
    task = asyncio.create_task(run_outbox_publisher(stop_event=stop_event))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)

    exchange = broker.exchange
    channel = broker.channel

    for queue_name, routing_key, _ in _BINDINGS:
        queue = await channel.declare_queue(
            queue_name,
            durable=True,
            arguments={"x-dead-letter-exchange": "foodize.dlx"},
        )
        await queue.bind(exchange, routing_key=routing_key)
        await queue.consume(partial(_process_message, routing_key=routing_key))
        logger.info("Consuming queue=%s routing_key=%s", queue_name, routing_key)

    logger.info("Worker started. Waiting for messages...")
    await stop_event.wait()
    logger.info("Stop event received, waiting for in-flight tasks to finish...")
    if task in _background_tasks:
        await asyncio.wait([task], timeout=10)


async def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    try:
        await start_consuming()
    finally:
        await broker.disconnect()
