import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.audit_log import service as audit_service
from features.notifications.events import OrderStatusChangedEvent
from features.notifications.outbox_service import enqueue_event
from features.orders.crud import order as order_crud
from features.orders.exceptions import (
    OrderAccessDeniedException,
    OrderNotCancellableException,
    OrderNotCompletableException,
    OrderNotFoundException,
    OrderReadyTimeRequiredException,
)
from features.orders.models import Order
from features.orders.schemas.order import OrderCancelRequest, OrderResponse, OrderStatusUpdate
from features.orders.services.order_utils import (
    CANCELLABLE_STATUSES,
    TERMINAL_STATUSES,
    safe_publish,
    validate_transition,
)
from features.promos import crud as promo_crud
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.permissions import CUSTOMER_PERMISSIONS, serialize_permissions


async def change_order_status(
    session: AsyncSession,
    order: Order,
    status_data: OrderStatusUpdate,
    actor: User,
) -> OrderResponse:
    old_status = OrderStatus(order.status)
    validate_transition(old_status, status_data.status)
    if status_data.status == OrderStatus.ACCEPTED:
        if status_data.estimated_ready_at:
            order.estimated_ready_at = status_data.estimated_ready_at
        else:
            minutes = status_data.estimated_ready_in_minutes
            if minutes:
                order.estimated_ready_at = datetime.now(timezone.utc) + timedelta(minutes=minutes)
            else:
                raise OrderReadyTimeRequiredException()
    return await _finalize_order(session, order, status_data.status, actor.id, actor.permissions)


async def _finalize_order(
    session: AsyncSession,
    order: Order,
    new_status: OrderStatus,
    actor_id: uuid.UUID,
    actor_permissions: list[str],
) -> OrderResponse:
    old_status = OrderStatus(order.status)
    if new_status == OrderStatus.CANCELLED and order.promo_id is not None:
        await promo_crud.release_promo_usage(session, order.promo_id, order.user_id)
    updated = await order_crud.update_order_status(session, order, new_status)
    await order_crud.create_order_event(
        session,
        order_id=order.id,
        actor_id=actor_id,
        actor_permissions=actor_permissions,
        old_status=old_status,
        new_status=new_status,
    )
    await enqueue_event(
        session,
        OrderStatusChangedEvent(
            order_id=order.id,
            order_display_id=str(order.display_id),
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            restaurant_name=order.restaurant.name,
            old_status=old_status,
            new_status=new_status,
            total_price=order.total_price,
        ),
    )
    await session.commit()
    await safe_publish(f"order_status:{order.id}", new_status.value)
    await safe_publish(
        f"restaurant_orders:{order.restaurant_id}",
        f"status_changed:{new_status.value}",
    )
    return OrderResponse.model_validate(updated)


async def complete_order(
    session: AsyncSession,
    identifier: str | uuid.UUID,
    user_id: uuid.UUID,
) -> OrderResponse:
    order = await order_crud.get_order_by_identifier_for_update(session, str(identifier))
    if not order:
        raise OrderNotFoundException()
    if order.user_id != user_id:
        raise OrderAccessDeniedException()
    if order.status != OrderStatus.READY.value:
        raise OrderNotCompletableException()
    return await _finalize_order(
        session,
        order,
        OrderStatus.COMPLETED,
        user_id,
        serialize_permissions(CUSTOMER_PERMISSIONS),
    )


async def cancel_order(
    session: AsyncSession,
    identifier: str | uuid.UUID,
    user_id: uuid.UUID,
    cancel_data: OrderCancelRequest,
) -> OrderResponse:
    order = await order_crud.get_order_by_identifier_for_update(session, str(identifier))
    if not order:
        raise OrderNotFoundException()
    if order.user_id != user_id:
        raise OrderAccessDeniedException()
    if OrderStatus(order.status) not in CANCELLABLE_STATUSES:
        raise OrderNotCancellableException()
    order.cancellation_reason = cancel_data.reason
    return await _finalize_order(
        session,
        order,
        OrderStatus.CANCELLED,
        user_id,
        serialize_permissions(CUSTOMER_PERMISSIONS),
    )


async def force_cancel_order(
    session: AsyncSession,
    order_id: uuid.UUID,
    actor: User,
    reason: str,
) -> OrderResponse:
    order = await order_crud.get_order_by_id_for_update(session, order_id)
    if not order:
        raise OrderNotFoundException()

    old_status = OrderStatus(order.status)
    if old_status in TERMINAL_STATUSES:
        raise OrderNotCancellableException()
    order.cancellation_reason = reason
    if order.promo_id is not None:
        await promo_crud.release_promo_usage(session, order.promo_id, order.user_id)
    updated = await order_crud.update_order_status(session, order, OrderStatus.CANCELLED)

    await order_crud.create_order_event(
        session,
        order_id=order.id,
        actor_id=actor.id,
        actor_permissions=actor.permissions,
        old_status=old_status,
        new_status=OrderStatus.CANCELLED,
    )
    await audit_service.log_action(
        session,
        actor_id=actor.id,
        action="FORCE_CANCEL_ORDER",
        entity_type="order",
        entity_id=order.id,
        details={"reason": reason, "old_status": old_status.value},
    )
    await enqueue_event(
        session,
        OrderStatusChangedEvent(
            order_id=order.id,
            order_display_id=str(order.display_id),
            user_id=order.user_id,
            restaurant_id=order.restaurant_id,
            restaurant_name=order.restaurant.name,
            old_status=old_status,
            new_status=OrderStatus.CANCELLED,
            total_price=order.total_price,
        ),
    )
    await session.commit()
    await safe_publish(f"order_status:{order.id}", OrderStatus.CANCELLED.value)
    await safe_publish(
        f"restaurant_orders:{order.restaurant_id}",
        f"status_changed:{OrderStatus.CANCELLED.value}",
    )
    return OrderResponse.model_validate(updated)
