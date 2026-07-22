import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.crud import create_notification
from features.notifications.events import (
    FeedbackRequestedEvent,
    OrderPlacedEvent,
    OrderStatusChangedEvent,
    UserNotificationMessage,
)
from features.notifications.models import NotificationType
from features.notifications.outbox_service import enqueue_event
from features.notifications.schemas import NotificationResponse
from infra.cache.redis import get_redis_cache
from shared.enums.order_status import OrderStatus
from shared.i18n import DEFAULT_LANGUAGE, translate
from utils.logging_setup import get_logger

logger = get_logger(__name__)

_FEEDBACK_DELAY_SECONDS = 1800

def _status_change_content(event: OrderStatusChangedEvent) -> tuple[str, dict[str, object]]:
    if event.new_status == OrderStatus.READY:
        return "notifications.orderReady", {"restaurant": event.restaurant_name}
    status_label = translate(
        f"notifications.orderStatus.{event.new_status.value}", DEFAULT_LANGUAGE
    )
    return (
        "notifications.orderStatusChanged",
        {"restaurant": event.restaurant_name, "status": status_label},
    )


async def _create_user_notification(
    session: AsyncSession, user_id: uuid.UUID, key: str, params: dict[str, object]
) -> str:
    notification = await create_notification(
        session=session,
        user_id=user_id,
        title=translate(f"{key}.title", DEFAULT_LANGUAGE, **params),
        message=translate(f"{key}.message", DEFAULT_LANGUAGE, **params),
        type=NotificationType.ORDER_STATUS,
        title_key=f"{key}.title",
        message_key=f"{key}.message",
        params=params,
    )
    return NotificationResponse.model_validate(notification).model_dump_json()


async def _publish_user_notification(message: UserNotificationMessage) -> None:
    redis_client = get_redis_cache()
    await redis_client.publish(f"user_notifications:{message.user_id}", message.payload)


async def handle_feedback_requested(session: AsyncSession, event: FeedbackRequestedEvent) -> None:
    logger.info(
        "notification.feedback_requested",
        order_id=str(event.order_id),
        restaurant_id=str(event.restaurant_id),
    )
    payload = await _create_user_notification(
        session,
        event.user_id,
        "notifications.feedbackRequested",
        {"restaurant": event.restaurant_name},
    )
    session.info["notification_payload"] = UserNotificationMessage(
        user_id=event.user_id, payload=payload
    )


async def handle_order_placed(session: AsyncSession, event: OrderPlacedEvent) -> None:
    logger.info(
        "order.placed",
        order_id=str(event.order_id),
        restaurant_id=str(event.restaurant_id),
        items_count=event.items_count,
    )
    payload = await _create_user_notification(
        session,
        event.user_id,
        "notifications.orderPlaced",
        {"restaurant": event.restaurant_name, "total": event.total_price},
    )
    session.info["notification_payload"] = UserNotificationMessage(
        user_id=event.user_id, payload=payload
    )


async def handle_order_status_changed(
    session: AsyncSession, event: OrderStatusChangedEvent
) -> None:
    logger.info(
        "order.status_changed",
        order_id=str(event.order_id),
        restaurant_id=str(event.restaurant_id),
        old_status=event.old_status.value,
        new_status=event.new_status.value,
    )

    key, params = _status_change_content(event)

    if event.new_status == OrderStatus.COMPLETED:
        run_at = datetime.now(UTC) + timedelta(seconds=_FEEDBACK_DELAY_SECONDS)
        await enqueue_event(
            session,
            FeedbackRequestedEvent(
                order_id=event.order_id,
                user_id=event.user_id,
                restaurant_id=event.restaurant_id,
                restaurant_name=event.restaurant_name,
            ),
            run_at=run_at,
        )

    payload = await _create_user_notification(session, event.user_id, key, params)
    session.info["notification_payload"] = UserNotificationMessage(
        user_id=event.user_id, payload=payload
    )
