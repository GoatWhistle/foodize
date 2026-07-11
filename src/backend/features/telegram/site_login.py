import asyncio
import secrets

import httpx
from fastapi import Response
from sqlalchemy.ext.asyncio import AsyncSession

from features.auth.service import issue_user_tokens
from features.telegram._shared import normalize_username
from features.telegram.crud import get_user_by_phone, get_user_by_telegram_username
from features.telegram.schemas import TelegramSiteLoginResponse
from features.users.models import User
from infra.cache.redis import get_redis_cache
from settings.config.app_config import settings
from shared.exceptions.existence import AuthException
from utils.jwt_tokens import hash_password

_SITE_LOGIN_CODE_TTL = 300
_SITE_LOGIN_CODE_PREFIX = "telegram_site_login:"
_SITE_LOGIN_RATE_PREFIX = "telegram_site_login_rate:"
_SITE_LOGIN_FAIL_PREFIX = "telegram_login_fail:"
_SITE_LOGIN_MAX_ATTEMPTS = 5


def _normalize_phone(phone: str) -> str:
    digits = "".join(c for c in phone if c.isdigit())
    if digits.startswith("8") and len(digits) == 11:
        digits = "7" + digits[1:]
    return f"+{digits}"


_TELEGRAM_SEND_RETRIES = 3


async def _send_telegram_message(payload: dict) -> None:
    url = f"https://api.telegram.org/bot{settings.telegram.bot_token}/sendMessage"
    async with httpx.AsyncClient(timeout=10, proxy=settings.telegram.proxy_url or None) as client:
        for attempt in range(_TELEGRAM_SEND_RETRIES):
            response = await client.post(url, json=payload)
            if response.status_code == 429 or response.status_code >= 500:
                if attempt == _TELEGRAM_SEND_RETRIES - 1:
                    response.raise_for_status()
                retry_after = 1.0
                try:
                    retry_after = float(
                        response.json().get("parameters", {}).get("retry_after", 2**attempt)
                    )
                except Exception:
                    retry_after = 2**attempt
                await asyncio.sleep(min(retry_after, 10))
                continue
            response.raise_for_status()
            return


async def request_site_login_code(session: AsyncSession, phone_number: str) -> None:
    phone_number = _normalize_phone(phone_number)

    cache = get_redis_cache()
    rate_key = f"{_SITE_LOGIN_RATE_PREFIX}{phone_number}"
    requests_count = await cache.incr_with_expire(rate_key, 300)
    if requests_count > 5:
        raise AuthException(detail="Too many code requests")

    user = await get_user_by_phone(session, phone_number)
    if not user or not user.telegram_id or not settings.telegram.bot_token:
        return

    code = f"{secrets.randbelow(1_000_000):06d}"
    await cache.set(f"{_SITE_LOGIN_CODE_PREFIX}{phone_number}", code, ttl=_SITE_LOGIN_CODE_TTL)

    message = (
        f"Код входа на сайт Foodize: {code}\n\n"
        "Если это были не вы, просто проигнорируйте сообщение."
    )

    await _send_telegram_message({"chat_id": user.telegram_id, "text": message})


async def verify_site_login_code(
    session: AsyncSession,
    phone_number: str,
    code: str,
    response: Response,
) -> TelegramSiteLoginResponse:
    phone_number = _normalize_phone(phone_number)
    cache = get_redis_cache()
    fail_key = f"{_SITE_LOGIN_FAIL_PREFIX}{phone_number}"
    fail_count = await cache.get(fail_key)
    if fail_count and int(fail_count) >= _SITE_LOGIN_MAX_ATTEMPTS:
        raise AuthException(detail="Too many failed attempts. Try again later.")

    key = f"{_SITE_LOGIN_CODE_PREFIX}{phone_number}"
    stored_code = await cache.get(key)
    if not stored_code or not secrets.compare_digest(stored_code, code):
        raw_client = cache.get_raw_client()
        await raw_client.incr(fail_key)
        await raw_client.expire(fail_key, _SITE_LOGIN_CODE_TTL)
        raise AuthException(detail="Invalid Telegram code")

    user = await get_user_by_phone(session, phone_number)
    if not user or not user.telegram_id:
        raise AuthException(detail="Invalid Telegram code")

    await cache.delete(key)
    await cache.delete(fail_key)
    tokens = issue_user_tokens(user=user, response=response)
    return TelegramSiteLoginResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        requires_password=not bool(user.hashed_password),
    )


async def set_site_password(session: AsyncSession, user: User, password: str) -> User:
    if user.hashed_password:
        raise AuthException(detail="Password is already set")

    user.hashed_password = await hash_password(password)
    await session.flush()
    await session.refresh(user)
    return user


async def request_site_login_code_by_username(
    session: AsyncSession, telegram_username: str
) -> None:
    username = normalize_username(telegram_username)

    cache = get_redis_cache()
    rate_key = f"{_SITE_LOGIN_RATE_PREFIX}u:{username}"
    requests_count = await cache.incr_with_expire(rate_key, 300)
    if requests_count > 5:
        raise AuthException(detail="Too many code requests")

    user = await get_user_by_telegram_username(session, username)
    if not user or not user.telegram_id or not settings.telegram.bot_token:
        return

    code = f"{secrets.randbelow(1_000_000):06d}"
    await cache.set(f"{_SITE_LOGIN_CODE_PREFIX}u:{username}", code, ttl=_SITE_LOGIN_CODE_TTL)

    message = (
        f"Код входа на сайт Foodize: <b>{code}</b>\n\n"
        "Если это были не вы, просто проигнорируйте сообщение."
    )

    await _send_telegram_message(
        {"chat_id": user.telegram_id, "text": message, "parse_mode": "HTML"}
    )


async def verify_site_login_code_by_username(
    session: AsyncSession,
    telegram_username: str,
    code: str,
    response: Response,
) -> TelegramSiteLoginResponse:
    username = normalize_username(telegram_username)
    cache = get_redis_cache()
    fail_key = f"{_SITE_LOGIN_FAIL_PREFIX}u:{username}"
    fail_count = await cache.get(fail_key)
    if fail_count and int(fail_count) >= _SITE_LOGIN_MAX_ATTEMPTS:
        raise AuthException(detail="Too many failed attempts. Try again later.")

    key = f"{_SITE_LOGIN_CODE_PREFIX}u:{username}"
    stored_code = await cache.get(key)
    if not stored_code or not secrets.compare_digest(stored_code, code):
        raw_client = cache.get_raw_client()
        await raw_client.incr(fail_key)
        await raw_client.expire(fail_key, _SITE_LOGIN_CODE_TTL)
        raise AuthException(detail="Invalid Telegram code")

    user = await get_user_by_telegram_username(session, username)
    if not user or not user.telegram_id:
        raise AuthException(detail="Invalid Telegram code")

    await cache.delete(key)
    await cache.delete(fail_key)
    tokens = issue_user_tokens(user=user, response=response)
    return TelegramSiteLoginResponse(
        access_token=tokens.access_token,
        refresh_token=tokens.refresh_token,
        token_type=tokens.token_type,
        requires_password=not bool(user.hashed_password),
    )
