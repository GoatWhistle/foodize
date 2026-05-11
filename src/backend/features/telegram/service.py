import hashlib
import hmac
import json
import time
from urllib.parse import parse_qsl

from sqlalchemy.ext.asyncio import AsyncSession

from features.auth.schemas import TokenResponse
from features.telegram.crud import get_user_by_phone, get_user_by_telegram_id
from features.telegram.exceptions import InvalidTelegramInitDataException
from features.telegram.schemas import TelegramCheckResponse
from features.users.models import User
from infra.cache.redis import get_redis_cache
from settings.config.app_config import settings
from shared.permissions import CUSTOMER_PERMISSIONS, serialize_permissions
from utils.JWT import create_access_token, create_refresh_token

_INIT_DATA_MAX_AGE = 86400


def _validate_init_data(init_data: str) -> dict:
    try:
        parsed = dict(parse_qsl(init_data, strict_parsing=True))
    except Exception:
        raise InvalidTelegramInitDataException()

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise InvalidTelegramInitDataException()

    auth_date = int(parsed.get("auth_date", 0))
    if time.time() - auth_date > _INIT_DATA_MAX_AGE:
        raise InvalidTelegramInitDataException(detail="initData expired")

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))

    secret_key = hmac.new(
        b"WebAppData",
        settings.telegram.bot_token.encode(),
        hashlib.sha256,
    ).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise InvalidTelegramInitDataException()

    return parsed


def _extract_tg_user(parsed: dict) -> dict:
    raw = parsed.get("user", "{}")
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        raise InvalidTelegramInitDataException(detail="Invalid user payload")


async def _cache_telegram_id(user_id: str, telegram_id: int) -> None:
    cache = get_redis_cache()
    await cache.set(f"user_tg:{user_id}", str(telegram_id), ttl=86400 * 30)


async def _delete_cached_telegram_id(user_id: str) -> None:
    cache = get_redis_cache()
    await cache.delete(f"user_tg:{user_id}")


def _make_tokens(user: User) -> TokenResponse:
    access_token = create_access_token(user.id, str(user.phone_number))
    refresh_token = create_refresh_token(user.id, str(user.phone_number))
    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="Bearer"
    )


async def telegram_check(session: AsyncSession, init_data: str) -> TelegramCheckResponse:
    parsed = _validate_init_data(init_data)
    tg_user = _extract_tg_user(parsed)
    telegram_id = int(tg_user["id"])

    existing = await get_user_by_telegram_id(session, telegram_id)
    if existing:
        return TelegramCheckResponse(status="registered")

    phone = tg_user.get("phone_number")
    return TelegramCheckResponse(status="new_user", phone_number=phone)


async def telegram_register(
    session: AsyncSession,
    init_data: str,
    phone_number: str,
    name: str,
) -> TokenResponse:
    parsed = _validate_init_data(init_data)
    tg_user = _extract_tg_user(parsed)
    telegram_id = int(tg_user["id"])
    telegram_username = tg_user.get("username")

    existing_by_tg = await get_user_by_telegram_id(session, telegram_id)
    if existing_by_tg:
        await _cache_telegram_id(str(existing_by_tg.id), telegram_id)
        return _make_tokens(existing_by_tg)

    existing_by_phone = await get_user_by_phone(session, phone_number)
    if existing_by_phone:
        existing_by_phone.telegram_id = telegram_id
        existing_by_phone.telegram_username = telegram_username
        await session.commit()
        await _cache_telegram_id(str(existing_by_phone.id), telegram_id)
        return _make_tokens(existing_by_phone)

    new_user = User(
        name=name,
        phone_number=phone_number,
        hashed_password=None,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        permissions=serialize_permissions(CUSTOMER_PERMISSIONS),
    )
    session.add(new_user)
    await session.commit()
    await session.refresh(new_user)
    await _cache_telegram_id(str(new_user.id), telegram_id)
    return _make_tokens(new_user)


async def link_phone_from_bot(
    session: AsyncSession,
    telegram_id: int,
    telegram_username: str | None,
    phone_number: str,
    name: str,
) -> User:
    existing_by_tg = await get_user_by_telegram_id(session, telegram_id)
    if existing_by_tg:
        await _cache_telegram_id(str(existing_by_tg.id), telegram_id)
        return existing_by_tg

    existing_by_phone = await get_user_by_phone(session, phone_number)
    if existing_by_phone:
        existing_by_phone.telegram_id = telegram_id
        existing_by_phone.telegram_username = telegram_username
        await session.commit()
        await session.refresh(existing_by_phone)
        await _cache_telegram_id(str(existing_by_phone.id), telegram_id)
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
    await session.commit()
    await session.refresh(new_user)
    await _cache_telegram_id(str(new_user.id), telegram_id)
    return new_user


async def unlink_telegram_for_user(session: AsyncSession, user: User) -> User:
    user.telegram_id = None
    user.telegram_username = None
    await session.commit()
    await session.refresh(user)
    await _delete_cached_telegram_id(str(user.id))
    return user


async def telegram_auth_existing(session: AsyncSession, init_data: str) -> TokenResponse:
    parsed = _validate_init_data(init_data)
    tg_user = _extract_tg_user(parsed)
    telegram_id = int(tg_user["id"])

    user = await get_user_by_telegram_id(session, telegram_id)
    if not user:
        raise InvalidTelegramInitDataException(detail="User not found")

    await _cache_telegram_id(str(user.id), telegram_id)
    return _make_tokens(user)
