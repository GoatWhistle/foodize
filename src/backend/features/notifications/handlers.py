import json
import logging

from database import db_helper
from features.notifications.crud import create_notification
from features.notifications.events import OrderPlacedEvent, OrderStatusChangedEvent
from features.notifications.models import NotificationType
from features.notifications.schemas import NotificationResponse
from infra.cache.redis import get_redis_cache
from shared.enums.order_status import OrderStatus

logger = logging.getLogger(__name__)


async def _notify_user(user_id, title: str, message: str) -> None:
    async with db_helper.session_factory() as session:
        notification = await create_notification(
            session=session,
            user_id=user_id,
            title=title,
            message=message,
            type=NotificationType.ORDER_STATUS,
        )
        
    # We serialize the notification explicitly to json string using pydantic's model_dump_json
    # Notice that pydantic handles UUID and datetime serialization.
    data = NotificationResponse.model_validate(notification).model_dump_json()
    redis_client = get_redis_cache()
    await redis_client.publish(f"user_notifications:{user_id}", data)


async def handle_order_placed(event: OrderPlacedEvent) -> None:
    logger.info(
        "[order.placed] order=%s user=%s restaurant=%r total=%d items=%d",
        event.order_id,
        event.user_id,
        event.restaurant_name,
        event.total_price,
        event.items_count,
    )
    title = f"Заказ в {event.restaurant_name} принят"
    message = f"Ваш заказ на сумму {event.total_price} ₽ успешно оформлен и ожидает подтверждения."
    await _notify_user(event.user_id, title, message)


async def handle_order_status_changed(event: OrderStatusChangedEvent) -> None:
    logger.info(
        "[order.status_changed] order=%s %s -> %s user=%s restaurant=%r",
        event.order_id,
        event.old_status.value,
        event.new_status.value,
        event.user_id,
        event.restaurant_name,
    )
    
    status_ru = {
        OrderStatus.PENDING: "Новый",
        OrderStatus.ACCEPTED: "Принят",
        OrderStatus.COOKING: "Готовится",
        OrderStatus.READY: "Готов к выдаче",
        OrderStatus.COMPLETED: "Выдан",
        OrderStatus.CANCELLED: "Отменен",
    }
    
    status_str = status_ru.get(event.new_status, event.new_status.value)
    title = "Статус заказа изменён"
    message = f"Ваш заказ из {event.restaurant_name} теперь в статусе: {status_str}."
    
    if event.new_status == OrderStatus.CANCELLED:
        title = "Заказ отменен"
        message = f"К сожалению, ваш заказ из {event.restaurant_name} был отменен."
    elif event.new_status == OrderStatus.READY:
        title = "Заказ готов!"
        message = f"Ваш заказ из {event.restaurant_name} готов к выдаче. Приятного аппетита!"
        
    await _notify_user(event.user_id, title, message)
