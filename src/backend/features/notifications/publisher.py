import logging

import aio_pika

from features.notifications.broker import broker
from features.notifications.events import OrderPlacedEvent, OrderStatusChangedEvent

logger = logging.getLogger(__name__)

# Routing key convention: <domain>.<entity>.<event>
_ROUTING = {
    "order.placed": "order.placed",
    "order.status_changed": "order.status_changed",
}


async def _publish(event: OrderPlacedEvent | OrderStatusChangedEvent) -> None:
    routing_key = _ROUTING.get(event.event_type, event.event_type)
    body = event.model_dump_json().encode()
    message = aio_pika.Message(
        body=body,
        content_type="application/json",
        delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
    )
    try:
        await broker.exchange.publish(message, routing_key=routing_key)
        logger.debug("Published %s (order=%s)", event.event_type, event.order_id)
    except Exception:
        # Never let a broker failure break the main request flow.
        logger.exception("Failed to publish event %s", event.event_type)


async def publish_order_placed(event: OrderPlacedEvent) -> None:
    await _publish(event)


async def publish_order_status_changed(event: OrderStatusChangedEvent) -> None:
    await _publish(event)
