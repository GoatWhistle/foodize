import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features import Order


async def get_orders_by_user_id(session: AsyncSession, user_id: uuid.UUID) -> list[Order]:
    result = await session.execute(select(Order).where(Order.user_id == user_id))
    return list(result.scalars().all())


async def get_order_by_id(session: AsyncSession, order_id: uuid.UUID) -> Order | None:
    result = await session.execute(select(Order).where(Order.id == order_id))
    return result.scalar_one_or_none()
