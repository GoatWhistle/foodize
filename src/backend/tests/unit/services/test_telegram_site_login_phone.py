from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.telegram.site_login import request_site_login_code, verify_site_login_code
from shared.exceptions.existence import AuthException

from .telegram_site_login_helpers import make_telegram_user


async def test_request_site_login_code_rate_limited() -> None:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=6)
    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        pytest.raises(AuthException, match="Too many code requests"),
    ):
        await request_site_login_code(AsyncMock(), "79001234567")


async def test_request_site_login_code_ignores_user_without_telegram_id() -> None:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=1)
    cache.set = AsyncMock()
    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        patch(
            "features.telegram.site_login.get_user_by_phone",
            new_callable=AsyncMock,
            return_value=make_telegram_user(telegram_id=None),
        ),
    ):
        await request_site_login_code(AsyncMock(), "79001234567")
    cache.set.assert_not_awaited()


async def test_verify_site_login_code_too_many_failed_attempts() -> None:
    cache = MagicMock()
    cache.get = AsyncMock(return_value="5")
    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        pytest.raises(AuthException, match="Too many failed attempts"),
    ):
        await verify_site_login_code(AsyncMock(), "79001234567", "123456")


async def test_verify_site_login_code_no_stored_code_increments_fail() -> None:
    cache = MagicMock()

    async def _get(key: str) -> str | None:
        del key
        return None

    cache.get = AsyncMock(side_effect=_get)
    raw = MagicMock()
    raw.incr = AsyncMock()
    raw.expire = AsyncMock()
    cache.get_raw_client = MagicMock(return_value=raw)

    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        pytest.raises(AuthException, match="Invalid Telegram code"),
    ):
        await verify_site_login_code(AsyncMock(), "79001234567", "123456")
    raw.incr.assert_awaited_once()
    raw.expire.assert_awaited_once()


async def test_verify_site_login_code_user_missing_after_correct_code() -> None:
    cache = MagicMock()

    async def _get(key: str) -> str | None:
        return None if "fail" in key else "123456"

    cache.get = AsyncMock(side_effect=_get)
    cache.delete = AsyncMock()

    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        patch(
            "features.telegram.site_login.get_user_by_phone",
            new_callable=AsyncMock,
            return_value=None,
        ),
        pytest.raises(AuthException, match="Invalid Telegram code"),
    ):
        await verify_site_login_code(AsyncMock(), "79001234567", "123456")
