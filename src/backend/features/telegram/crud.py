import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.users.models import User


async def get_user_by_telegram_id(session: AsyncSession, telegram_id: int) -> User | None:
    result = await session.execute(select(User).where(User.telegram_id == telegram_id))
    return result.scalar_one_or_none()


async def get_user_by_telegram_username(session: AsyncSession, username: str) -> User | None:
    normalized = username.lstrip("@").lower()
    result = await session.execute(select(User).where(User.telegram_username.ilike(normalized)))
    return result.scalar_one_or_none()


async def get_user_by_phone(session: AsyncSession, phone_number: str) -> User | None:
    result = await session.execute(select(User).where(User.phone_number == phone_number))
    return result.scalar_one_or_none()


async def get_telegram_id_by_user_id(session: AsyncSession, user_id: uuid.UUID) -> int | None:
    result = await session.execute(select(User.telegram_id).where(User.id == user_id))
    return result.scalar_one_or_none()
