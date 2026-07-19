import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from features.users.models import User
from shared.enums.order_status import OrderStatus


def _apply_order_filters[SelectT: Select[Any]](
    stmt: SelectT,
    status: OrderStatus | None,
    restaurant_id: uuid.UUID | None,
    user_id: uuid.UUID | None,
    search: str | None,
    date_from: date | None,
    date_to: date | None,
) -> SelectT:
    if status is not None:
        stmt = stmt.where(Order.status == status.value)
    if restaurant_id is not None:
        stmt = stmt.where(Order.restaurant_id == restaurant_id)
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.name.ilike(pattern))
            | (User.phone_number.ilike(pattern))
            | (Restaurant.name.ilike(pattern))
        )
    if date_from is not None:
        stmt = stmt.where(
            Order.created_at >= datetime.combine(date_from, datetime.min.time(), tzinfo=UTC)
        )
    if date_to is not None:
        stmt = stmt.where(
            Order.created_at
            < datetime.combine(date_to + timedelta(days=1), datetime.min.time(), tzinfo=UTC)
        )
    return stmt


async def get_all_orders(
    session: AsyncSession,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[Order]:
    stmt = (
        select(Order)
        .join(User, User.id == Order.user_id)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.menu_item),
            selectinload(Order.items).selectinload(OrderItem.selected_options),
            selectinload(Order.user),
            selectinload(Order.restaurant),
        )
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    stmt = _apply_order_filters(stmt, status, restaurant_id, user_id, search, date_from, date_to)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_all_orders(
    session: AsyncSession,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> int:
    stmt = (
        select(func.count())
        .select_from(Order)
        .join(User, User.id == Order.user_id)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
    )
    stmt = _apply_order_filters(stmt, status, restaurant_id, user_id, search, date_from, date_to)
    result = await session.execute(stmt)
    return result.scalar_one()
