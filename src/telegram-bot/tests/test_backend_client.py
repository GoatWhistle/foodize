from collections.abc import AsyncIterator
from http import HTTPStatus

import httpx
import pytest
from pytest_mock import MockerFixture

from config import bot_config
from services import backend_client


@pytest.fixture(autouse=True)
async def _reset_client() -> AsyncIterator[None]:
    await backend_client.close_client()
    yield
    await backend_client.close_client()


def test_get_client_is_singleton() -> None:
    backend_client.init_client()
    first = backend_client.get_client()
    second = backend_client.get_client()
    assert first is second
    assert isinstance(first, httpx.AsyncClient)


@pytest.mark.asyncio
async def test_close_client_resets_singleton() -> None:
    backend_client.init_client()
    client = backend_client.get_client()
    await backend_client.close_client()
    assert client.is_closed
    new_client = backend_client.get_client()
    assert new_client is not client
    assert not new_client.is_closed


@pytest.mark.asyncio
async def test_calls_reuse_shared_client(mocker: MockerFixture) -> None:
    bot_config.bot_api_secret = "secret"
    bot_config.backend_url = "http://backend"
    backend_client.init_client()
    shared = backend_client.get_client()

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/vendor-status")
    resp = httpx.Response(HTTPStatus.OK, json={"data": {"is_vendor": True}}, request=req)
    mock_post = mocker.patch.object(shared, "post", return_value=resp)

    await backend_client.get_vendor_status(111)
    await backend_client.get_active_orders(222)

    assert mock_post.await_count == 2
    assert backend_client.get_client() is shared


@pytest.mark.asyncio
async def test_get_telegram_id_by_user_success(mocker: MockerFixture) -> None:
    bot_config.backend_url = "http://backend"
    backend_client.init_client()
    shared = backend_client.get_client()

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/telegram-id")
    resp = httpx.Response(HTTPStatus.OK, json={"data": {"telegram_id": 55555}}, request=req)
    mocker.patch.object(shared, "post", return_value=resp)

    result = await backend_client.get_telegram_id_by_user("user_x")
    assert result == 55555


@pytest.mark.asyncio
async def test_get_telegram_id_by_user_http_error_returns_none(mocker: MockerFixture) -> None:
    bot_config.backend_url = "http://backend"
    backend_client.init_client()
    shared = backend_client.get_client()

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/telegram-id")
    resp = httpx.Response(HTTPStatus.NOT_FOUND, request=req)
    err = httpx.HTTPStatusError("Not Found", request=req, response=resp)
    mocker.patch.object(shared, "post", side_effect=err)

    result = await backend_client.get_telegram_id_by_user("user_x")
    assert result is None
