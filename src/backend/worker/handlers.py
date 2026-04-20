"""Event handlers — each function receives a parsed event and acts on it.

For now the handlers only log.  Replace the body of each handler with
real notification logic (Telegram Bot API, email via SMTP, SMS via
external gateway, etc.) without touching the consumer wiring.
"""
import logging

from features.notifications.events import OrderPlacedEvent, OrderStatusChangedEvent

logger = logging.getLogger(__name__)


async def handle_order_placed(event: OrderPlacedEvent) -> None:
    logger.info(
        "[order.placed] order=%s user=%s restaurant=%r total=%d items=%d",
        event.order_id,
        event.user_id,
        event.restaurant_name,
        event.total_price,
        event.items_count,
    )


async def handle_order_status_changed(event: OrderStatusChangedEvent) -> None:
    logger.info(
        "[order.status_changed] order=%s %s -> %s user=%s restaurant=%r",
        event.order_id,
        event.old_status.value,
        event.new_status.value,
        event.user_id,
        event.restaurant_name,
    )
