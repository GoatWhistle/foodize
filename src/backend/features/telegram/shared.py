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

_TELEGRAM_ID_CACHE_TTL_SECONDS = 30 * 86_400


def normalize_username(username: str) -> str:
    return username.lstrip("@").lower().strip()


async def cache_telegram_id(user_id: str, telegram_id: int) -> None:
    cache = get_redis_cache()
    await cache.set(f"user_tg:{user_id}", str(telegram_id), ttl=_TELEGRAM_ID_CACHE_TTL_SECONDS)


async def delete_cached_telegram_id(user_id: str) -> None:
    cache = get_redis_cache()
    await cache.delete(f"user_tg:{user_id}")


def make_tokens(user: User) -> TokenResponse:
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="Bearer"
    )


async def _persist_and_cache(session: AsyncSession, user: User, telegram_id: int) -> User:
    await session.flush()
    await session.refresh(user)
    await cache_telegram_id(str(user.id), telegram_id)
    return user


async def _refresh_username_if_changed(
    session: AsyncSession, user: User, telegram_username: str | None
) -> None:
    if not telegram_username:
        return
    normalized = normalize_username(telegram_username)
    if user.telegram_username == normalized:
        return
    user.telegram_username = normalized
    await session.flush()
    await session.refresh(user)


async def _find_by_username_and_link(
    session: AsyncSession, telegram_id: int, telegram_username: str
) -> User | None:
    normalized_username = normalize_username(telegram_username)
    existing_by_username = await get_user_by_telegram_username(session, normalized_username)
    if not existing_by_username:
        return None
    existing_by_username.telegram_id = telegram_id
    existing_by_username.telegram_username = normalized_username
    return await _persist_and_cache(session, existing_by_username, telegram_id)


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
        if update_username_on_tg_match:
            await _refresh_username_if_changed(session, existing_by_tg, telegram_username)
        await cache_telegram_id(str(existing_by_tg.id), telegram_id)
        return existing_by_tg

    if check_username and telegram_username:
        linked = await _find_by_username_and_link(session, telegram_id, telegram_username)
        if linked:
            return linked

    existing_by_phone = await get_user_by_phone(session, phone_number)
    if existing_by_phone:
        existing_by_phone.telegram_id = telegram_id
        existing_by_phone.telegram_username = telegram_username
        return await _persist_and_cache(session, existing_by_phone, telegram_id)

    new_user = User(
        name=name,
        phone_number=phone_number,
        hashed_password=None,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        permissions=serialize_permissions(CUSTOMER_PERMISSIONS),
    )
    session.add(new_user)
    return await _persist_and_cache(session, new_user, telegram_id)
