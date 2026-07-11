from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from config import bot_config
from handlers.start import (
    _link_phone,
    cmd_orders,
    cmd_vendor_status,
)


@pytest.mark.asyncio
async def test_link_phone_failure_no_secret():
    m = AsyncMock()
    m.from_user = MagicMock()
    bot_config.bot_api_secret = ""
    res = await _link_phone(m, "+79990000000")
    assert res is False
    m.answer.assert_called_with(
        "Бот пока не настроен для регистрации: не задан TELEGRAM__BOT_API_SECRET."
    )


@pytest.mark.asyncio
async def test_link_phone_http_status_errors(mocker):
    m = AsyncMock()
    m.from_user = MagicMock()
    bot_config.bot_api_secret = "secret"
    bot_config.backend_url = "http://backend"

    mock_post = mocker.patch("httpx.AsyncClient.post")

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/link-phone")
    resp_403 = httpx.Response(403, request=req)
    mock_post.side_effect = httpx.HTTPStatusError("Forbidden", request=req, response=resp_403)
    res = await _link_phone(m, "+79990000000")
    assert res is False
    m.answer.assert_called_with("Бот не прошел проверку доступа к Foodize API.")

    resp_500 = httpx.Response(500, request=req)
    mock_post.side_effect = httpx.HTTPStatusError("Server Error", request=req, response=resp_500)
    res = await _link_phone(m, "+79990000000")
    assert res is False
    m.answer.assert_called_with(
        "Не получилось привязать телефон. Проверьте номер и попробуйте еще раз."
    )

    mock_post.side_effect = httpx.HTTPError("Conn Error")
    res = await _link_phone(m, "+79990000000")
    assert res is False
    m.answer.assert_called_with("Foodize API сейчас недоступен. Попробуйте чуть позже.")


@pytest.mark.asyncio
async def test_link_phone_success(mocker):
    m = AsyncMock()
    m.from_user = MagicMock()
    bot_config.bot_api_secret = "secret"
    bot_config.backend_url = "http://backend"
    bot_config.mini_app_url = "https://t.me/app"

    mock_post = mocker.patch("httpx.AsyncClient.post")
    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/link-phone")
    mock_post.return_value = httpx.Response(200, request=req)

    res = await _link_phone(m, "+79990000000")
    assert res is True
    assert m.answer.call_count == 2


@pytest.mark.asyncio
async def test_cmd_vendor_status(mocker):
    m = AsyncMock()
    m.from_user = None
    await cmd_vendor_status(m)

    m.from_user = MagicMock()
    bot_config.bot_api_secret = ""
    await cmd_vendor_status(m)
    m.answer.assert_called_with("Проверка статуса вендора пока не настроена.")

    bot_config.bot_api_secret = "secret"
    mock_post = mocker.patch("httpx.AsyncClient.post")

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/vendor-status")
    resp_403 = httpx.Response(403, request=req)
    mock_post.side_effect = httpx.HTTPStatusError("Forbidden", request=req, response=resp_403)
    await cmd_vendor_status(m)
    m.answer.assert_called_with("Бот не прошел проверку доступа к Foodize API.")

    resp_500 = httpx.Response(500, request=req)
    mock_post.side_effect = httpx.HTTPStatusError("Server Error", request=req, response=resp_500)
    await cmd_vendor_status(m)
    m.answer.assert_called_with("Не удалось получить статус. Попробуйте позже.")

    mock_post.side_effect = httpx.HTTPError("Conn Error")
    await cmd_vendor_status(m)
    m.answer.assert_called_with("Foodize API сейчас недоступен. Попробуйте чуть позже.")

    mock_post.side_effect = None
    mock_post.return_value = httpx.Response(
        200, request=req, json={"data": {"is_vendor": True, "approval_status": "APPROVED"}}
    )
    await cmd_vendor_status(m)
    assert "одобрена" in m.answer.call_args[0][0]


@pytest.mark.asyncio
async def test_cmd_orders(mocker):
    m = AsyncMock()
    m.from_user = None
    await cmd_orders(m)

    m.from_user = MagicMock()
    bot_config.bot_api_secret = ""
    await cmd_orders(m)
    m.answer.assert_called_with("Просмотр заказов пока не настроен.")

    bot_config.bot_api_secret = "secret"
    mock_post = mocker.patch("httpx.AsyncClient.post")

    req = httpx.Request("POST", "http://backend/api/v1/telegram/bot/orders")
    resp_403 = httpx.Response(403, request=req)
    mock_post.side_effect = httpx.HTTPStatusError("Forbidden", request=req, response=resp_403)
    await cmd_orders(m)
    m.answer.assert_called_with("Бот не прошел проверку доступа к Foodize API.")

    resp_500 = httpx.Response(500, request=req)
    mock_post.side_effect = httpx.HTTPStatusError("Server Error", request=req, response=resp_500)
    await cmd_orders(m)
    m.answer.assert_called_with("Не удалось получить заказы. Попробуйте позже.")

    mock_post.side_effect = httpx.HTTPError("Conn error")
    await cmd_orders(m)
    m.answer.assert_called_with("Foodize API сейчас недоступен. Попробуйте чуть позже.")

    mock_post.side_effect = None
    mock_post.return_value = httpx.Response(200, request=req, json={"data": []})
    await cmd_orders(m)
    m.answer.assert_called_with("Активных заказов сейчас нет.")

    mock_post.return_value = httpx.Response(
        200,
        request=req,
        json={
            "data": [
                {
                    "display_id": "123",
                    "restaurant_name": "Cafe",
                    "status": "COOKING",
                    "total_price": 1000,
                }
            ]
        },
    )
    await cmd_orders(m)
    assert "Ваши активные заказы" in m.answer.call_args[0][0]
