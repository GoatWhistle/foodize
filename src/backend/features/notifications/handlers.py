import asyncio
import uuid

from database import db_helper
from features.notifications.crud import create_notification
from features.notifications.events import OrderPlacedEvent, OrderStatusChangedEvent
from features.notifications.models import NotificationType
from features.notifications.schemas import NotificationResponse
from infra.cache.redis import get_redis_cache
from shared.enums.order_status import OrderStatus
from utils.logging_setup import get_logger

logger = get_logger(__name__)

_FEEDBACK_DELAY_SECONDS = 1800


def _log_feedback_task_error(task: asyncio.Task) -> None:
    exc = task.exception()
    if exc is not None:
        logger.error("feedback task failed", error=repr(exc))


async def _notify_user(user_id: uuid.UUID, title: str, message: str) -> None:
    async with db_helper.session_factory() as session:
        notification = await create_notification(
            session=session,
            user_id=user_id,
            title=title,
            message=message,
            type=NotificationType.ORDER_STATUS,
        )

    data = NotificationResponse.model_validate(notification).model_dump_json()
    redis_client = get_redis_cache()
    await redis_client.publish(f"user_notifications:{user_id}", data)


async def _schedule_feedback_request(
    user_id: uuid.UUID, restaurant_name: str, delay_seconds: int = _FEEDBACK_DELAY_SECONDS
) -> None:
    await asyncio.sleep(delay_seconds)
    title = "Оцените ваш заказ"
    message = (
        f"Как вам заказ из {restaurant_name}? Пожалуйста, оставьте отзыв"
        " в мини-приложении, это поможет ресторану стать лучше!"
    )
    await _notify_user(user_id, title, message)


async def handle_order_placed(event: OrderPlacedEvent) -> None:
    logger.info(
        "order.placed",
        order_id=str(event.order_id),
        restaurant_id=str(event.restaurant_id),
        items_count=event.items_count,
    )
    title = f"Заказ в {event.restaurant_name} принят"
    message = f"Ваш заказ на сумму {event.total_price} ₽ успешно оформлен и ожидает подтверждения."
    await _notify_user(event.user_id, title, message)


async def handle_order_status_changed(event: OrderStatusChangedEvent) -> None:
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
        task = asyncio.create_task(
            _schedule_feedback_request(
                event.user_id, event.restaurant_name, _FEEDBACK_DELAY_SECONDS
            )
        )
        task.add_done_callback(_log_feedback_task_error)

    await _notify_user(event.user_id, title, message)
