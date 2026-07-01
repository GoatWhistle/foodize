import hashlib
import hmac
import json
import time
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
)
from features.telegram.schemas import TelegramCheckResponse
from features.users.models import User
from settings.config.app_config import settings

_INIT_DATA_MAX_AGE = 3600


def _validate_init_data(init_data: str) -> dict:
    try:
        parsed = dict(parse_qsl(init_data, strict_parsing=True))
    except Exception:
        raise MalformedTelegramInitDataException()

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise MalformedTelegramInitDataException(detail="Missing hash")

    auth_date_raw = parsed.get("auth_date")
    if not auth_date_raw:
        raise MalformedTelegramInitDataException(detail="Missing auth_date")

    try:
        auth_date = int(auth_date_raw)
    except (ValueError, TypeError):
        raise MalformedTelegramInitDataException(detail="Invalid auth_date")

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
        data = json.loads(raw)
        if "id" not in data:
            raise MalformedTelegramInitDataException(detail="Missing user id")
        return data
    except (json.JSONDecodeError, TypeError):
        raise MalformedTelegramInitDataException(detail="Invalid user payload")


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
    tg_user = _extract_tg_user(parsed)
    telegram_id = int(tg_user["id"])

    user = await get_user_by_telegram_id(session, telegram_id)
    if not user:
        raise InvalidTelegramInitDataException(detail="User not found")

    await cache_telegram_id(str(user.id), telegram_id)
    return make_tokens(user)


async def unlink_telegram_for_user(session: AsyncSession, user: User) -> User:
    user.telegram_id = None
    user.telegram_username = None
    await session.commit()
    await session.refresh(user)
    await delete_cached_telegram_id(str(user.id))
    return user
