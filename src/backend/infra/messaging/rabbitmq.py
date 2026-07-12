import json
from typing import Any

import aio_pika

from features.notifications.broker import RabbitMQBroker, broker
from infra.messaging.base import MessagePublisher
from utils.logging_setup import get_logger

logger = get_logger(__name__)


class RabbitMQPublisher(MessagePublisher):
    def __init__(self, broker: RabbitMQBroker) -> None:
        self._broker = broker

    async def publish(self, routing_key: str, body: bytes | dict[str, Any]) -> None:
        if isinstance(body, dict):
            body = json.dumps(body).encode()
        message = aio_pika.Message(
            body=body,
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        try:
            await self._broker.exchange.publish(message, routing_key=routing_key)
            logger.debug("message_published", routing_key=routing_key)
        except Exception:
            logger.exception("message_publish_failed", routing_key=routing_key)
            raise


def get_rabbitmq_publisher() -> RabbitMQPublisher:
    return RabbitMQPublisher(broker)
