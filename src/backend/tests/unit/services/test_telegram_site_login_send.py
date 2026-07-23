from http import HTTPStatus
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from features.telegram.site_login import send_telegram_message

from .telegram_site_login_helpers import FakeClient, FakeResponse, patch_telegram_client


async def test_send_message_retries_on_429_then_succeeds() -> None:
    client = FakeClient(
        [
            FakeResponse(HTTPStatus.TOO_MANY_REQUESTS, {"parameters": {"retry_after": 0}}),
            FakeResponse(HTTPStatus.OK),
        ]
    )
    with (
        patch_telegram_client(client),
        patch("features.telegram.site_login.asyncio.sleep", new_callable=AsyncMock) as sleep,
    ):
        await send_telegram_message({"chat_id": 1, "text": "hi"})

    assert len(client.calls) == 2
    sleep.assert_awaited_once()


async def test_send_message_retries_on_5xx_with_backoff_default() -> None:
    client = FakeClient(
        [
            FakeResponse(HTTPStatus.INTERNAL_SERVER_ERROR, "not-json"),
            FakeResponse(HTTPStatus.OK),
        ]
    )
    with (
        patch_telegram_client(client),
        patch("features.telegram.site_login.asyncio.sleep", new_callable=AsyncMock) as sleep,
    ):
        await send_telegram_message({"chat_id": 1, "text": "hi"})

    sleep.assert_awaited_once()
    assert sleep.await_args is not None
    assert sleep.await_args.args[0] == 1.0


async def test_send_message_raises_after_all_retries() -> None:
    client = FakeClient(
        [
            FakeResponse(HTTPStatus.INTERNAL_SERVER_ERROR),
            FakeResponse(HTTPStatus.INTERNAL_SERVER_ERROR),
            FakeResponse(HTTPStatus.INTERNAL_SERVER_ERROR),
        ]
    )
    with (
        patch_telegram_client(client),
        patch("features.telegram.site_login.asyncio.sleep", new_callable=AsyncMock),
        pytest.raises(httpx.HTTPStatusError),
    ):
        await send_telegram_message({"chat_id": 1, "text": "hi"})
