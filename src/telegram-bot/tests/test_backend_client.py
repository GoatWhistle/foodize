from collections.abc import AsyncIterator
from http import HTTPStatus

import httpx
import pytest
from pytest_mock import MockerFixture

from config import bot_config
from services import backend_client


@pytest.fixture(autouse=True)
async def _reset_client(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[None]:
    monkeypatch.setattr(bot_config, "backend_url", "http://backend")
    monkeypatch.setattr(bot_config, "bot_api_secret", "secret")
    await backend_client.close_client()
    yield
    await backend_client.close_client()


def test_get_client_is_singleton() -> None:
    backend_client.init_client()
    first = backend_client.get_client()
    second = backend_client.get_client()
    assert first is second
    assert isinstance(first, httpx.AsyncClient)


async def test_close_client_resets_singleton() -> None:
    backend_client.init_client()
    client = backend_client.get_client()
    await backend_client.close_client()
    assert client.is_closed
    new_client = backend_client.get_client()
    assert new_client is not client
    assert not new_client.is_closed


async def test_calls_reuse_shared_client(mocker: MockerFixture) -> None:
    backend_client.init_client()
    shared = backend_client.get_client()

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/vendor-status")
    resp = httpx.Response(HTTPStatus.OK, json={"data": {"is_vendor": True}}, request=req)
    mock_post = mocker.patch.object(shared, "post", return_value=resp)

    await backend_client.get_vendor_status(111)
    await backend_client.get_active_orders(222)

    assert mock_post.await_count == 2
    assert backend_client.get_client() is shared


async def test_post_sends_url_secret_header_and_json_body(mocker: MockerFixture) -> None:
    backend_client.init_client()
    shared = backend_client.get_client()

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/link-phone")
    resp = httpx.Response(HTTPStatus.OK, json={"data": {}}, request=req)
    mock_post = mocker.patch.object(shared, "post", return_value=resp)

    await backend_client.link_phone(
        telegram_id=111, telegram_username="ivan", phone_number="+79990000000", name="Ivan"
    )

    args, kwargs = mock_post.call_args
    assert args[0] == "http://backend/api/v1/telegram/bot/link-phone"
    assert kwargs["headers"] == {"X-Telegram-Bot-Secret": "secret"}
    assert kwargs["json"] == {
        "telegram_id": 111,
        "telegram_username": "ivan",
        "phone_number": "+79990000000",
        "name": "Ivan",
    }


async def test_get_telegram_id_by_user_success(mocker: MockerFixture) -> None:
    backend_client.init_client()
    shared = backend_client.get_client()

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/telegram-id")
    resp = httpx.Response(HTTPStatus.OK, json={"data": {"telegram_id": 55555}}, request=req)
    mock_post = mocker.patch.object(shared, "post", return_value=resp)

    result = await backend_client.get_telegram_id_by_user("user_x")

    assert result == 55555
    args, kwargs = mock_post.call_args
    assert args[0] == "http://backend/api/v1/telegram/bot/telegram-id"
    assert kwargs["json"] == {"user_id": "user_x"}
    assert kwargs["headers"]["X-Telegram-Bot-Secret"] == "secret"


async def test_get_telegram_id_by_user_http_error_returns_none(mocker: MockerFixture) -> None:
    backend_client.init_client()
    shared = backend_client.get_client()

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/telegram-id")
    resp = httpx.Response(HTTPStatus.NOT_FOUND, request=req)
    err = httpx.HTTPStatusError("Not Found", request=req, response=resp)
    mocker.patch.object(shared, "post", side_effect=err)

    result = await backend_client.get_telegram_id_by_user("user_x")
    assert result is None
