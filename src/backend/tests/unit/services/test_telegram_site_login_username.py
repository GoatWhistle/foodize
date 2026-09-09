from http import HTTPStatus
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.telegram.site_login import (
    request_site_login_code_by_username,
    verify_site_login_code_by_username,
)
from settings.config.app_config import settings
from shared.exceptions.existence import AuthException

from .telegram_site_login_helpers import (
    FakeClient,
    FakeResponse,
    make_telegram_user,
    patch_telegram_client,
)


async def test_request_by_username_rate_limited() -> None:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=6)
    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        pytest.raises(AuthException, match="Too many code requests"),
    ):
        await request_site_login_code_by_username(AsyncMock(), "@Ivan_TG")


async def test_request_by_username_sends_html_message() -> None:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=1)
    cache.set = AsyncMock()
    client = FakeClient([FakeResponse(HTTPStatus.OK)])
    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        patch(
            "features.telegram.site_login.get_user_by_telegram_username",
            new_callable=AsyncMock,
            return_value=make_telegram_user(),
        ),
        patch("features.telegram.site_login.secrets.randbelow", return_value=7),
        patch_telegram_client(client),
        patch.object(settings.telegram, "bot_token", "test-token"),
    ):
        await request_site_login_code_by_username(AsyncMock(), "@Ivan_TG")

    cache.set.assert_awaited_once_with("telegram_site_login:u:ivan_tg", "000007", ttl=300)
    assert client.calls[0]["parse_mode"] == "HTML"
    assert "000007" in client.calls[0]["text"]


async def test_verify_by_username_success_issues_tokens() -> None:
    cache = MagicMock()

    async def _get(key: str) -> str | None:
        return None if "fail" in key else "654321"

    cache.get = AsyncMock(side_effect=_get)
    cache.delete = AsyncMock()
    user = make_telegram_user(hashed_password="already")

    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        patch(
            "features.telegram.site_login.get_user_by_telegram_username",
            new_callable=AsyncMock,
            return_value=user,
        ),
        patch("features.telegram.site_login.issue_user_tokens") as issue,
    ):
        issue.return_value.access_token = "a"
        issue.return_value.refresh_token = "r"
        issue.return_value.token_type = "Bearer"
        result = await verify_site_login_code_by_username(AsyncMock(), "@Ivan_TG", "654321")

    assert result.access_token == "a"
    assert result.requires_password is False


async def test_verify_by_username_too_many_failed() -> None:
    cache = MagicMock()
    cache.get = AsyncMock(return_value="5")
    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        pytest.raises(AuthException, match="Too many failed attempts"),
    ):
        await verify_site_login_code_by_username(AsyncMock(), "@ivan", "654321")


async def test_verify_by_username_wrong_code_increments() -> None:
    cache = MagicMock()

    async def _get(key: str) -> str | None:
        return None if "fail" in key else "654321"

    cache.get = AsyncMock(side_effect=_get)
    raw = MagicMock()
    raw.incr = AsyncMock()
    raw.expire = AsyncMock()
    cache.get_raw_client = MagicMock(return_value=raw)

    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        pytest.raises(AuthException, match="Invalid Telegram code"),
    ):
        await verify_site_login_code_by_username(AsyncMock(), "@ivan", "000000")
    raw.incr.assert_awaited_once()
