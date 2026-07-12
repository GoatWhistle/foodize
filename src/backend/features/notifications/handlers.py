import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.crud import create_notification
from features.notifications.events import (
    FeedbackRequestedEvent,
    OrderPlacedEvent,
    OrderStatusChangedEvent,
)
from features.notifications.models import NotificationType
from features.notifications.outbox_service import enqueue_event
from features.notifications.schemas import NotificationResponse
from infra.cache.redis import get_redis_cache
from shared.enums.order_status import OrderStatus
from utils.logging_setup import get_logger

logger = get_logger(__name__)

_FEEDBACK_DELAY_SECONDS = 1800


async def _create_user_notification(
    session: AsyncSession, user_id: uuid.UUID, title: str, message: str
) -> str:
    notification = await create_notification(
        session=session,
        user_id=user_id,
        title=title,
        message=message,
        type=NotificationType.ORDER_STATUS,
    )
    return NotificationResponse.model_validate(notification).model_dump_json()


async def _publish_user_notification(user_id: uuid.UUID, payload: str) -> None:
    redis_client = get_redis_cache()
    await redis_client.publish(f"user_notifications:{user_id}", payload)


async def handle_feedback_requested(session: AsyncSession, event: FeedbackRequestedEvent) -> None:
    logger.info(
        "notification.feedback_requested",
        order_id=str(event.order_id),
        restaurant_id=str(event.restaurant_id),
    )
    title = "Оцените ваш заказ"
    message = (
        f"Как вам заказ из {event.restaurant_name}? Пожалуйста, оставьте отзыв"
        " в мини-приложении, это поможет ресторану стать лучше!"
    )
    payload = await _create_user_notification(session, event.user_id, title, message)
    session.info["notification_payload"] = (event.user_id, payload)


async def handle_order_placed(session: AsyncSession, event: OrderPlacedEvent) -> None:
    logger.info(
        "order.placed",
        order_id=str(event.order_id),
        restaurant_id=str(event.restaurant_id),
        items_count=event.items_count,
    )
    title = f"Заказ в {event.restaurant_name} принят"
    message = f"Ваш заказ на сумму {event.total_price} ₽ успешно оформлен и ожидает подтверждения."
    payload = await _create_user_notification(session, event.user_id, title, message)
    session.info["notification_payload"] = (event.user_id, payload)


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

    status_ru = {
        OrderStatus.PENDING: "Ожидается",
        OrderStatus.ACCEPTED: "Принят",
        OrderStatus.READY: "Готово",
        OrderStatus.COMPLETED: "Выполнено",
        OrderStatus.CANCELLED: "Отменён",
    }

    status_str = status_ru.get(event.new_status, event.new_status.value)
    title = "Статус заказа изменён"
    message = f"Ваш заказ из {event.restaurant_name} теперь в статусе: {status_str}."

    if event.new_status == OrderStatus.READY:
        title = "Заказ готов!"
        message = f"Ваш заказ из {event.restaurant_name} готов к выдаче. Приятного аппетита!"

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

    payload = await _create_user_notification(session, event.user_id, title, message)
    session.info["notification_payload"] = (event.user_id, payload)
