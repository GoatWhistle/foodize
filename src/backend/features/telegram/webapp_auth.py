import hashlib
import hmac
import json
import time
from typing import Any, cast
from urllib.parse import parse_qsl

from sqlalchemy.ext.asyncio import AsyncSession

from features.auth.schemas import TokenResponse
from features.telegram._shared import (
    cache_telegram_id,
    delete_cached_telegram_id,
    find_or_create_telegram_user,
    make_tokens,
)
from features.telegram.crud import get_user_by_telegram_id
from features.telegram.exceptions import (
    InvalidTelegramInitDataException,
    MalformedTelegramInitDataException,
    TelegramInitDataAlreadyUsedException,
    TelegramInitDataAuthDateInvalidException,
    TelegramInitDataAuthDateMissingException,
    TelegramInitDataExpiredException,
    TelegramInitDataHashMissingException,
    TelegramInitDataUserIdMissingException,
    TelegramInitDataUserPayloadInvalidException,
    TelegramUserNotFoundException,
)
from features.telegram.schemas import TelegramCheckResponse
from features.users.models import User
from infra.cache.redis import get_redis_cache
from settings.config.app_config import settings

_INIT_DATA_MAX_AGE = 3600
_INIT_DATA_NONCE_PREFIX = "telegram_initdata_nonce:"


def _validate_init_data(init_data: str) -> dict[str, str]:
    try:
        parsed = dict(parse_qsl(init_data, strict_parsing=True))
    except Exception as exc:
        raise MalformedTelegramInitDataException() from exc

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise TelegramInitDataHashMissingException()

    auth_date_raw = parsed.get("auth_date")
    if not auth_date_raw:
        raise TelegramInitDataAuthDateMissingException()

    try:
        auth_date = int(auth_date_raw)
    except (ValueError, TypeError) as exc:
        raise TelegramInitDataAuthDateInvalidException() from exc

    if time.time() - auth_date > _INIT_DATA_MAX_AGE:
        raise TelegramInitDataExpiredException()

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))

    secret_key = hmac.new(
        b"WebAppData",
        settings.telegram.bot_token.encode(),
        hashlib.sha256,
    ).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected_hash, received_hash):
        raise InvalidTelegramInitDataException()

    parsed["hash"] = received_hash
    parsed["auth_date"] = str(auth_date)
    return parsed


async def _consume_init_data_nonce(parsed: dict[str, str], purpose: str) -> None:
    received_hash = parsed.get("hash")
    auth_date = int(parsed["auth_date"])
    now = int(time.time())
    ttl = auth_date + _INIT_DATA_MAX_AGE - now
    if ttl <= 0:
        raise TelegramInitDataExpiredException()
    cache = get_redis_cache()
    key = f"{_INIT_DATA_NONCE_PREFIX}{purpose}:{received_hash}"
    is_new = await cache.set_nx(key, "1", ttl=ttl)
    if not is_new:
        raise TelegramInitDataAlreadyUsedException()


def _extract_tg_user(parsed: dict[str, str]) -> dict[str, Any]:
    raw = parsed.get("user", "{}")
    try:
        data = json.loads(raw)
    except (json.JSONDecodeError, TypeError) as exc:
        raise TelegramInitDataUserPayloadInvalidException() from exc
    if "id" not in data:
        raise TelegramInitDataUserIdMissingException()
    return cast("dict[str, Any]", data)


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
    await _consume_init_data_nonce(parsed, "register")
    tg_user = _extract_tg_user(parsed)
    telegram_id = int(tg_user["id"])
    telegram_username = tg_user.get("username")

    user = await find_or_create_telegram_user(
        session,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        phone_number=phone_number,
        name=name,
        check_username=False,
    )
    return make_tokens(user)


async def telegram_auth_existing(session: AsyncSession, init_data: str) -> TokenResponse:
    parsed = _validate_init_data(init_data)
    await _consume_init_data_nonce(parsed, "auth")
    tg_user = _extract_tg_user(parsed)
    telegram_id = int(tg_user["id"])

    user = await get_user_by_telegram_id(session, telegram_id)
    if not user:
        raise TelegramUserNotFoundException()

    await cache_telegram_id(str(user.id), telegram_id)
    return make_tokens(user)


async def unlink_telegram_for_user(session: AsyncSession, user: User) -> User:
    user.telegram_id = None
    user.telegram_username = None
    await session.flush()
    await session.refresh(user)
    await delete_cached_telegram_id(str(user.id))
    return user
