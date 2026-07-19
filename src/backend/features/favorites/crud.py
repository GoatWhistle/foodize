import uuid
from datetime import datetime

from sqlalchemy import func, select, tuple_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.favorites.models import Favorite


async def get_favorite(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> Favorite | None:
    result = await session.execute(
        select(Favorite)
        .where(Favorite.user_id == user_id, Favorite.restaurant_id == restaurant_id)
        .options(selectinload(Favorite.restaurant))
    )
    return result.scalar_one_or_none()


async def get_favorites_by_user(
    session: AsyncSession,
    user_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
    cursor_created_at: datetime | None = None,
    cursor_id: uuid.UUID | None = None,
) -> list[Favorite]:
    query = (
        select(Favorite)
        .where(Favorite.user_id == user_id)
        .options(selectinload(Favorite.restaurant))
        .order_by(Favorite.created_at.desc(), Favorite.id.desc())
        .limit(limit)
    )
    if cursor_created_at is not None and cursor_id is not None:
        query = query.where(
            tuple_(Favorite.created_at, Favorite.id) < (cursor_created_at, cursor_id)
        )
    else:
        query = query.offset(offset)
    result = await session.execute(query)
    return list(result.scalars().all())


async def count_favorites_by_user(session: AsyncSession, user_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count()).select_from(Favorite).where(Favorite.user_id == user_id)
    )
    return result.scalar_one()


async def create_favorite(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> Favorite:
    favorite = Favorite(user_id=user_id, restaurant_id=restaurant_id)
    session.add(favorite)
    await session.flush()
    result = await session.execute(
        select(Favorite)
        .where(Favorite.id == favorite.id)
        .options(selectinload(Favorite.restaurant))
    )
    return result.scalar_one()


async def delete_favorite(session: AsyncSession, favorite: Favorite) -> None:
    await session.delete(favorite)
    await session.flush()
