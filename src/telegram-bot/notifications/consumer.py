import asyncio
import functools
import json
import logging

import aio_pika
from aiogram import Bot

from config import bot_config
from notifications.handlers import handle_order_placed, handle_order_status_changed
from services import redis_client
from utils.enums import EventType

logger = logging.getLogger(__name__)

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 2.0
_DEDUP_TTL_SECONDS = 86400


def _dedup_key(event_id: str) -> str:
    return f"bot_event:{event_id}"


async def _claim_event(event_id: str) -> bool:
    claimed = await redis_client.get_client().set(
        _dedup_key(event_id), "1", nx=True, ex=_DEDUP_TTL_SECONDS
    )
    return bool(claimed)


async def _release_event(event_id: str) -> None:
    await redis_client.get_client().delete(_dedup_key(event_id))


_BINDINGS = [
    ("bot.notifications.order.placed", EventType.ORDER_PLACED.value, handle_order_placed),
    (
        "bot.notifications.order.status_changed",
        EventType.ORDER_STATUS_CHANGED.value,
        handle_order_status_changed,
    ),
]


async def _process(
    message: aio_pika.IncomingMessage,
    handler,
    bot: Bot,
    exchange: aio_pika.Exchange,
    routing_key: str,
) -> None:
    event_id: str | None = None
    try:
        event = json.loads(message.body)
        raw_event_id = event.get("event_id")
        event_id = str(raw_event_id) if raw_event_id else None
        if event_id and not await _claim_event(event_id):
            logger.info("Skipping duplicate event_id=%s", event_id)
            await message.ack()
            return
        await handler(event, bot)
        await message.ack()
    except Exception:
        logger.exception("Failed to process notification message")
        if event_id:
            await _release_event(event_id)
        headers = message.headers or {}
        retry_count = headers.get("x-retry-count", 0)

        if retry_count < _MAX_RETRIES:
            backoff = _RETRY_BASE_DELAY * (2**retry_count)
            logger.info(
                "Requeueing message (attempt %d/%d) after %.1fs backoff",
                retry_count + 1,
                _MAX_RETRIES,
                backoff,
            )
            await asyncio.sleep(backoff)
            new_headers = dict(headers)
            new_headers["x-retry-count"] = retry_count + 1

            new_message = aio_pika.Message(
                body=message.body,
                headers=new_headers,
                delivery_mode=message.delivery_mode,
            )
            await exchange.publish(new_message, routing_key=routing_key)
            await message.ack()
        else:
            logger.error("Message exceeded max retries, moving to DLQ")
            await message.reject(requeue=False)


async def start_notification_consumer(bot: Bot) -> None:
    connection = await aio_pika.connect_robust(bot_config.rabbitmq_url)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    exchange = await channel.declare_exchange(
        "foodize.events",
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )

    dlx = await channel.declare_exchange(
        "foodize.dlx",
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )

    for queue_name, routing_key, handler in _BINDINGS:
        dlq = await channel.declare_queue(f"{queue_name}.dlq", durable=True)
        await dlq.bind(dlx, routing_key=queue_name)

        queue = await channel.declare_queue(
            queue_name,
            durable=True,
            arguments={
                "x-dead-letter-exchange": "foodize.dlx",
                "x-dead-letter-routing-key": queue_name,
            },
        )
        await queue.bind(exchange, routing_key=routing_key)
        await queue.consume(
            functools.partial(
                _process, handler=handler, bot=bot, exchange=exchange, routing_key=routing_key
            )
        )
        logger.info("Bot subscribed: queue=%s routing_key=%s", queue_name, routing_key)

    logger.info("Notification consumer started")
    await asyncio.Future()
