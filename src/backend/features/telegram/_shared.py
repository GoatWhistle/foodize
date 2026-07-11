from sqlalchemy.ext.asyncio import AsyncSession

from features.auth.schemas import TokenResponse
from features.telegram.crud import (
    get_user_by_phone,
    get_user_by_telegram_id,
    get_user_by_telegram_username,
)
from features.users.models import User
from infra.cache.redis import get_redis_cache
from shared.permissions import CUSTOMER_PERMISSIONS, serialize_permissions
from utils.jwt_tokens import create_access_token, create_refresh_token


def normalize_username(username: str) -> str:
    return username.lstrip("@").lower().strip()


async def cache_telegram_id(user_id: str, telegram_id: int) -> None:
    cache = get_redis_cache()
    await cache.set(f"user_tg:{user_id}", str(telegram_id), ttl=86400 * 30)


async def delete_cached_telegram_id(user_id: str) -> None:
    cache = get_redis_cache()
    await cache.delete(f"user_tg:{user_id}")


def make_tokens(user: User) -> TokenResponse:
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="Bearer"
    )


async def find_or_create_telegram_user(
    session: AsyncSession,
    *,
    telegram_id: int,
    telegram_username: str | None,
    phone_number: str,
    name: str,
    check_username: bool,
    update_username_on_tg_match: bool = False,
) -> User:
    existing_by_tg = await get_user_by_telegram_id(session, telegram_id)
    if existing_by_tg:
        if update_username_on_tg_match and telegram_username:
            normalized = normalize_username(telegram_username)
            if existing_by_tg.telegram_username != normalized:
                existing_by_tg.telegram_username = normalized
                await session.flush()
                await session.refresh(existing_by_tg)
        await cache_telegram_id(str(existing_by_tg.id), telegram_id)
        return existing_by_tg

    if check_username and telegram_username:
        normalized_username = normalize_username(telegram_username)
        existing_by_username = await get_user_by_telegram_username(session, normalized_username)
        if existing_by_username:
            existing_by_username.telegram_id = telegram_id
            existing_by_username.telegram_username = normalized_username
            await session.flush()
            await session.refresh(existing_by_username)
            await cache_telegram_id(str(existing_by_username.id), telegram_id)
            return existing_by_username

    existing_by_phone = await get_user_by_phone(session, phone_number)
    if existing_by_phone:
        existing_by_phone.telegram_id = telegram_id
        existing_by_phone.telegram_username = telegram_username
        await session.flush()
        await session.refresh(existing_by_phone)
        await cache_telegram_id(str(existing_by_phone.id), telegram_id)
        return existing_by_phone

    new_user = User(
        name=name,
        phone_number=phone_number,
        hashed_password=None,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        permissions=serialize_permissions(CUSTOMER_PERMISSIONS),
    )
    session.add(new_user)
    await session.flush()
    await session.refresh(new_user)
    await cache_telegram_id(str(new_user.id), telegram_id)
    return new_user
