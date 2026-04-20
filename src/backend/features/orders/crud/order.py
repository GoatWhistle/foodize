import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.orders.models import Order, OrderEvent, OrderItem
from shared.enums.order_status import OrderStatus


def _items_options() -> Any:
    return selectinload(Order.items).selectinload(OrderItem.menu_item)


def _full_options() -> tuple[Any, Any]:
    return _items_options(), selectinload(Order.restaurant)


async def get_orders_by_user_id(
    session: AsyncSession,
    user_id: uuid.UUID,
    status: OrderStatus | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[Order]:
    stmt = select(Order).where(Order.user_id == user_id).options(_items_options())
    if status is not None:
        stmt = stmt.where(Order.status == status.value)
    stmt = stmt.order_by(Order.created_at.desc()).offset(offset).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def get_order_by_id(session: AsyncSession, order_id: uuid.UUID) -> Order | None:
    result = await session.execute(
        select(Order).where(Order.id == order_id).options(*_full_options())
    )
    return result.scalar_one_or_none()


async def get_orders_by_restaurant_id(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    status: OrderStatus | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.restaurant_id == restaurant_id)
        .order_by(Order.created_at.desc())
        .options(_items_options())
    )
    if status is not None:
        stmt = stmt.where(Order.status == status.value)
    stmt = stmt.offset(offset).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_orders_by_user_id(
    session: AsyncSession,
    user_id: uuid.UUID,
    status: OrderStatus | None = None,
) -> int:
    stmt = select(func.count()).select_from(Order).where(Order.user_id == user_id)
    if status is not None:
        stmt = stmt.where(Order.status == status.value)
    result = await session.execute(stmt)
    return result.scalar_one()


async def count_orders_by_restaurant_id(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    status: OrderStatus | None = None,
) -> int:
    stmt = select(func.count()).select_from(Order).where(Order.restaurant_id == restaurant_id)
    if status is not None:
        stmt = stmt.where(Order.status == status.value)
    result = await session.execute(stmt)
    return result.scalar_one()


async def update_order_status(
    session: AsyncSession, order: Order, new_status: OrderStatus
) -> Order:
    order.status = new_status.value
    if new_status == OrderStatus.READY:
        order.ready_at = datetime.now(timezone.utc)
    await session.commit()
    await session.refresh(order)
    return order


async def create_order_event(
    session: AsyncSession,
    order_id: uuid.UUID,
    actor_id: uuid.UUID,
    actor_role: str,
    old_status: OrderStatus,
    new_status: OrderStatus,
) -> OrderEvent:
    event = OrderEvent(
        order_id=order_id,
        actor_id=actor_id,
        actor_role=actor_role,
        old_status=old_status.value,
        new_status=new_status.value,
    )
    session.add(event)
    await session.commit()
    await session.refresh(event)
    return event


async def get_events_by_order_id(session: AsyncSession, order_id: uuid.UUID) -> list[OrderEvent]:
    result = await session.execute(
        select(OrderEvent).where(OrderEvent.order_id == order_id).order_by(OrderEvent.created_at)
    )
    return list(result.scalars().all())


async def cancel_order(session: AsyncSession, order: Order) -> Order:
    order.status = OrderStatus.CANCELLED.value
    await session.commit()
    await session.refresh(order)
    return order
