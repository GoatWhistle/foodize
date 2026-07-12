from http import HTTPStatus
from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest
from pytest_mock import MockerFixture

from config import bot_config
from handlers.start import (
    _auto_register,
    cmd_start,
    handle_contact,
    handle_restart_button,
)


@pytest.mark.asyncio
async def test_cmd_start_deep_link_restaurant(mocker: MockerFixture) -> None:
    mocker.patch("handlers.start._auto_register", new_callable=AsyncMock)
    m = AsyncMock()
    m.text = "/start restaurant_123"

    bot_config.backend_url = "http://backend"
    bot_config.mini_app_url = "https://t.me/app"

    mock_get = mocker.patch("httpx.AsyncClient.get")
    req = httpx.Request("GET", "http://backend/api/v1/restaurants/public/123")
    mock_get.return_value = httpx.Response(
        HTTPStatus.OK, request=req, json={"data": {"name": "Cafe Delicious"}}
    )

    await cmd_start(m)
    m.answer.assert_called_once()
    assert "Cafe Delicious" in m.answer.call_args[0][0]

    m.answer.reset_mock()
    mock_get.side_effect = httpx.HTTPError("Err")
    await cmd_start(m)
    m.answer.assert_called_once()


@pytest.mark.asyncio
async def test_cmd_start_deep_link_order(mocker: MockerFixture) -> None:
    mocker.patch("handlers.start._auto_register", new_callable=AsyncMock)
    m = AsyncMock()
    m.text = "/start order_456"
    bot_config.mini_app_url = "https://t.me/app"
    await cmd_start(m)
    m.answer.assert_called_once()
    assert "456" in m.answer.call_args[0][0]


@pytest.mark.asyncio
async def test_cmd_start_default(mocker: MockerFixture) -> None:
    mocker.patch("handlers.start._auto_register", new_callable=AsyncMock)
    m = AsyncMock()
    m.text = "/start"
    m.from_user = MagicMock(username="testuser")
    bot_config.mini_app_url = "https://t.me/app"
    await cmd_start(m)
    assert m.answer.call_count == 2


@pytest.mark.asyncio
async def test_handle_restart_button(mocker: MockerFixture) -> None:
    mock_cmd_start = mocker.patch("handlers.start.cmd_start")
    m = AsyncMock()
    await handle_restart_button(m)
    mock_cmd_start.assert_called_once_with(m)


@pytest.mark.asyncio
async def test_auto_register_no_user_does_nothing(mocker: MockerFixture) -> None:
    mock_register = mocker.patch("handlers.start.backend_client.register_by_telegram")
    m = AsyncMock()
    m.from_user = None
    await _auto_register(m)
    mock_register.assert_not_called()


@pytest.mark.asyncio
async def test_auto_register_skips_without_bot_api_secret(mocker: MockerFixture) -> None:
    mock_register = mocker.patch("handlers.start.backend_client.register_by_telegram")
    m = AsyncMock()
    m.from_user = MagicMock(id=111, username="ivan")
    bot_config.bot_api_secret = ""
    await _auto_register(m)
    mock_register.assert_not_called()


@pytest.mark.asyncio
async def test_auto_register_calls_backend_with_expected_args(mocker: MockerFixture) -> None:
    bot_config.bot_api_secret = "secret"
    mock_register = mocker.patch(
        "handlers.start.backend_client.register_by_telegram",
        new_callable=AsyncMock,
    )
    m = AsyncMock()
    m.from_user = MagicMock(id=111, username="ivan", full_name="Ivan Ivanov")
    await _auto_register(m)
    mock_register.assert_awaited_once_with(
        telegram_id=111,
        telegram_username="ivan",
        name="Ivan Ivanov",
    )


@pytest.mark.asyncio
async def test_auto_register_swallows_http_status_error(mocker: MockerFixture) -> None:
    bot_config.bot_api_secret = "secret"
    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/register")
    resp = httpx.Response(HTTPStatus.FORBIDDEN, request=req)
    mocker.patch(
        "handlers.start.backend_client.register_by_telegram",
        new_callable=AsyncMock,
        side_effect=httpx.HTTPStatusError("Forbidden", request=req, response=resp),
    )
    m = AsyncMock()
    m.from_user = MagicMock(id=111, username="ivan", full_name="Ivan Ivanov")
    await _auto_register(m)
    m.answer.assert_not_called()


@pytest.mark.asyncio
async def test_auto_register_swallows_http_network_error(mocker: MockerFixture) -> None:
    bot_config.bot_api_secret = "secret"
    mocker.patch(
        "handlers.start.backend_client.register_by_telegram",
        new_callable=AsyncMock,
        side_effect=httpx.HTTPError("Conn Error"),
    )
    m = AsyncMock()
    m.from_user = MagicMock(id=111, username="ivan", full_name="Ivan Ivanov")
    await _auto_register(m)
    m.answer.assert_not_called()


@pytest.mark.asyncio
async def test_cmd_start_calls_auto_register(mocker: MockerFixture) -> None:
    mock_auto_register = mocker.patch("handlers.start._auto_register", new_callable=AsyncMock)
    m = AsyncMock()
    m.text = "/start"
    m.from_user = MagicMock(username="testuser")
    bot_config.mini_app_url = "https://t.me/app"
    await cmd_start(m)
    mock_auto_register.assert_awaited_once_with(m)


@pytest.mark.asyncio
async def test_handle_contact(mocker: MockerFixture) -> None:
    m = AsyncMock()
    m.contact = None
    await handle_contact(m)

    m.contact = MagicMock()
    m.from_user = MagicMock()
    m.contact.user_id = 999
    m.from_user.id = 888
    await handle_contact(m)
    m.answer.assert_called_with("Пожалуйста, отправьте свой номер телефона.")

    m.contact.user_id = 888
    m.contact.phone_number = "+79990000000"
    mock_link = mocker.patch("handlers.start._link_phone")
    await handle_contact(m)
    mock_link.assert_called_once()
