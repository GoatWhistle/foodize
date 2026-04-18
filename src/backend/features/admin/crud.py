import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


async def get_all_users(
    session: AsyncSession,
    role: UserRole | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc()).offset(offset).limit(limit)
    if role is not None:
        stmt = stmt.where(User.user_role == role)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_all_users(session: AsyncSession, role: UserRole | None = None) -> int:
    stmt = select(func.count()).select_from(User)
    if role is not None:
        stmt = stmt.where(User.user_role == role)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def deactivate_user(session: AsyncSession, user: User) -> User:
    user.is_active = False
    await session.commit()
    await session.refresh(user)
    return user


async def get_all_orders(
    session: AsyncSession,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[Order]:
    stmt = (
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if status is not None:
        stmt = stmt.where(Order.status == status)
    if restaurant_id is not None:
        stmt = stmt.where(Order.restaurant_id == restaurant_id)
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def count_all_orders(
    session: AsyncSession,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    user_id: uuid.UUID | None = None,
) -> int:
    stmt = select(func.count()).select_from(Order)
    if status is not None:
        stmt = stmt.where(Order.status == status)
    if restaurant_id is not None:
        stmt = stmt.where(Order.restaurant_id == restaurant_id)
    if user_id is not None:
        stmt = stmt.where(Order.user_id == user_id)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_platform_stats(session: AsyncSession) -> dict:
    users_by_role_rows = await session.execute(
        select(User.user_role, func.count()).group_by(User.user_role)
    )
    users_by_role = {row[0].value: row[1] for row in users_by_role_rows.all()}

    orders_by_status_rows = await session.execute(
        select(Order.status, func.count()).group_by(Order.status)
    )
    orders_by_status = {row[0].value: row[1] for row in orders_by_status_rows.all()}

    total_restaurants_result = await session.execute(select(func.count()).select_from(Restaurant))
    total_restaurants = total_restaurants_result.scalar_one()

    return {
        "users_by_role": users_by_role,
        "orders_by_status": orders_by_status,
        "total_restaurants": total_restaurants,
    }
