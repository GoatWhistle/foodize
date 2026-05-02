import asyncio
import json
import logging

import aio_pika
from aiogram import Bot

from config import bot_config
from notifications.handlers import handle_order_placed, handle_order_status_changed

logger = logging.getLogger(__name__)

_BINDINGS = [
    ("bot.notifications.order.placed", "order.placed", handle_order_placed),
    (
        "bot.notifications.order.status_changed",
        "order.status_changed",
        handle_order_status_changed,
    ),
]


async def _process(message: aio_pika.IncomingMessage, handler, bot: Bot) -> None:
    async with message.process(requeue=False):
        try:
            event = json.loads(message.body)
            await handler(event, bot)
        except Exception:
            logger.exception("Failed to process notification message")


async def start_notification_consumer(bot: Bot) -> None:
    connection = await aio_pika.connect_robust(bot_config.rabbitmq_url)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    exchange = await channel.declare_exchange(
        "foodize.events",
        aio_pika.ExchangeType.TOPIC,
        durable=True,
    )

    for queue_name, routing_key, handler in _BINDINGS:
        queue = await channel.declare_queue(queue_name, durable=True)
        await queue.bind(exchange, routing_key=routing_key)
        await queue.consume(lambda msg, h=handler: _process(msg, h, bot))
        logger.info("Bot subscribed: queue=%s routing_key=%s", queue_name, routing_key)

    logger.info("Notification consumer started")
    await asyncio.Future()
