import uuid
from http import HTTPStatus
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from features.telegram.site_login import (
    _send_telegram_message,
    request_site_login_code,
    request_site_login_code_by_username,
    verify_site_login_code,
    verify_site_login_code_by_username,
)
from features.users.models import User
from shared.exceptions.existence import AuthException


def _user(*, telegram_id: int | None = 123456, hashed_password: str | None = None) -> User:
    user = User()
    user.id = uuid.uuid4()
    user.name = "Telegram User"
    user.phone_number = "+79001234567"
    user.telegram_id = telegram_id
    user.telegram_username = "ivan_tg"
    user.hashed_password = hashed_password
    return user


class _Response:
    def __init__(self, status_code: int = HTTPStatus.OK, body: Any = None) -> None:
        self.status_code = status_code
        self._body = body if body is not None else {}
        self.raised = False

    def json(self) -> Any:
        return self._body

    def raise_for_status(self) -> None:
        self.raised = True
        if self.status_code >= HTTPStatus.BAD_REQUEST:
            raise httpx.HTTPStatusError("err", request=MagicMock(), response=MagicMock())


class _Client:
    def __init__(self, responses: list[_Response]) -> None:
        self._responses = responses
        self.calls: list[dict[str, Any]] = []

    async def __aenter__(self) -> "_Client":
        return self

    async def __aexit__(self, *args: Any) -> None:
        return None

    async def post(self, url: str, json: dict[str, Any]) -> _Response:
        self.calls.append(json)
        return self._responses.pop(0)


def _patch_client(client: _Client) -> Any:
    return patch("features.telegram.site_login.httpx.AsyncClient", return_value=client)


async def test_send_message_retries_on_429_then_succeeds() -> None:
    client = _Client(
        [
            _Response(HTTPStatus.TOO_MANY_REQUESTS, {"parameters": {"retry_after": 0}}),
            _Response(HTTPStatus.OK),
        ]
    )
    with (
        _patch_client(client),
        patch("features.telegram.site_login.asyncio.sleep", new_callable=AsyncMock) as sleep,
    ):
        await _send_telegram_message({"chat_id": 1, "text": "hi"})

    assert len(client.calls) == 2
    sleep.assert_awaited_once()


async def test_send_message_retries_on_5xx_with_backoff_default() -> None:
    client = _Client(
        [
            _Response(HTTPStatus.INTERNAL_SERVER_ERROR, "not-json"),
            _Response(HTTPStatus.OK),
        ]
    )
    with (
        _patch_client(client),
        patch("features.telegram.site_login.asyncio.sleep", new_callable=AsyncMock) as sleep,
    ):
        await _send_telegram_message({"chat_id": 1, "text": "hi"})

    sleep.assert_awaited_once()
    assert sleep.await_args is not None
    assert sleep.await_args.args[0] == 1.0


async def test_send_message_raises_after_all_retries() -> None:
    client = _Client(
        [
            _Response(HTTPStatus.INTERNAL_SERVER_ERROR),
            _Response(HTTPStatus.INTERNAL_SERVER_ERROR),
            _Response(HTTPStatus.INTERNAL_SERVER_ERROR),
        ]
    )
    with (
        _patch_client(client),
        patch("features.telegram.site_login.asyncio.sleep", new_callable=AsyncMock),
    ):
        with pytest.raises(httpx.HTTPStatusError):
            await _send_telegram_message({"chat_id": 1, "text": "hi"})


async def test_request_site_login_code_rate_limited() -> None:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=6)
    with patch("features.telegram.site_login.get_redis_cache", return_value=cache):
        with pytest.raises(AuthException, match="Too many code requests"):
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
            return_value=_user(telegram_id=None),
        ),
    ):
        await request_site_login_code(AsyncMock(), "79001234567")
    cache.set.assert_not_awaited()


async def test_verify_site_login_code_too_many_failed_attempts() -> None:
    cache = MagicMock()
    cache.get = AsyncMock(return_value="5")
    with patch("features.telegram.site_login.get_redis_cache", return_value=cache):
        with pytest.raises(AuthException, match="Too many failed attempts"):
            await verify_site_login_code(AsyncMock(), "79001234567", "123456")


async def test_verify_site_login_code_no_stored_code_increments_fail() -> None:
    cache = MagicMock()

    async def _get(key: str) -> str | None:
        return None

    cache.get = AsyncMock(side_effect=_get)
    raw = MagicMock()
    raw.incr = AsyncMock()
    raw.expire = AsyncMock()
    cache.get_raw_client = MagicMock(return_value=raw)

    with patch("features.telegram.site_login.get_redis_cache", return_value=cache):
        with pytest.raises(AuthException, match="Invalid Telegram code"):
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
    ):
        with pytest.raises(AuthException, match="Invalid Telegram code"):
            await verify_site_login_code(AsyncMock(), "79001234567", "123456")


async def test_request_by_username_rate_limited() -> None:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=6)
    with patch("features.telegram.site_login.get_redis_cache", return_value=cache):
        with pytest.raises(AuthException, match="Too many code requests"):
            await request_site_login_code_by_username(AsyncMock(), "@Ivan_TG")


async def test_request_by_username_sends_html_message() -> None:
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=1)
    cache.set = AsyncMock()
    client = _Client([_Response(HTTPStatus.OK)])
    with (
        patch("features.telegram.site_login.get_redis_cache", return_value=cache),
        patch(
            "features.telegram.site_login.get_user_by_telegram_username",
            new_callable=AsyncMock,
            return_value=_user(),
        ),
        patch("features.telegram.site_login.secrets.randbelow", return_value=7),
        _patch_client(client),
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
    user = _user(hashed_password="already")

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
    with patch("features.telegram.site_login.get_redis_cache", return_value=cache):
        with pytest.raises(AuthException, match="Too many failed attempts"):
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

    with patch("features.telegram.site_login.get_redis_cache", return_value=cache):
        with pytest.raises(AuthException, match="Invalid Telegram code"):
            await verify_site_login_code_by_username(AsyncMock(), "@ivan", "000000")
    raw.incr.assert_awaited_once()
