from collections.abc import Callable
from http import HTTPStatus

import httpx
import pytest
from aiogram.types import Message
from pytest_mock import MockerFixture

from config import bot_config
from handlers.start import (
    _link_phone,
    cmd_orders,
    cmd_vendor_status,
)
from tests.conftest import answer_of


@pytest.fixture(autouse=True)
def _configured(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "secret")
    monkeypatch.setattr(bot_config, "backend_url", "http://backend")
    monkeypatch.setattr(bot_config, "mini_app_url", "https://t.me/app")


def _http_status_error(status: int, path: str) -> httpx.HTTPStatusError:
    req = httpx.Request("POST", f"http://backend/api/v1{path}")
    resp = httpx.Response(status, request=req)
    return httpx.HTTPStatusError("error", request=req, response=resp)


async def test_link_phone_failure_no_secret(
    monkeypatch: pytest.MonkeyPatch, message_factory: Callable[..., Message]
) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "")
    message = message_factory()

    res = await _link_phone(message, "+79990000000")

    assert res is False
    answer_of(message).assert_called_with(
        "Бот пока не настроен для регистрации: не задан TELEGRAM__BOT_API_SECRET."
    )


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (
            _http_status_error(HTTPStatus.FORBIDDEN, "/telegram/bot/link-phone"),
            "Бот не прошел проверку доступа к Foodize API.",
        ),
        (
            _http_status_error(HTTPStatus.INTERNAL_SERVER_ERROR, "/telegram/bot/link-phone"),
            "Не получилось привязать телефон. Проверьте номер и попробуйте еще раз.",
        ),
        (
            httpx.HTTPError("Conn Error"),
            "Foodize API сейчас недоступен. Попробуйте чуть позже.",
        ),
    ],
)
async def test_link_phone_http_errors(
    mocker: MockerFixture,
    message_factory: Callable[..., Message],
    error: Exception,
    expected: str,
) -> None:
    mocker.patch("handlers.start.backend_client.link_phone", side_effect=error)
    message = message_factory()

    res = await _link_phone(message, "+79990000000")

    assert res is False
    answer_of(message).assert_called_with(expected)


async def test_link_phone_success(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch("handlers.start.backend_client.link_phone", return_value=None)
    message = message_factory()

    res = await _link_phone(message, "+79990000000")

    assert res is True
    assert answer_of(message).call_count == 2


async def test_cmd_vendor_status_no_user_does_nothing(
    message_factory: Callable[..., Message],
) -> None:
    message = message_factory(from_user=None)
    await cmd_vendor_status(message)
    answer_of(message).assert_not_called()


async def test_cmd_vendor_status_not_configured(
    monkeypatch: pytest.MonkeyPatch, message_factory: Callable[..., Message]
) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "")
    message = message_factory()
    await cmd_vendor_status(message)
    answer_of(message).assert_called_with("Проверка статуса вендора пока не настроена.")


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (
            _http_status_error(HTTPStatus.FORBIDDEN, "/telegram/bot/vendor-status"),
            "Бот не прошел проверку доступа к Foodize API.",
        ),
        (
            _http_status_error(HTTPStatus.INTERNAL_SERVER_ERROR, "/telegram/bot/vendor-status"),
            "Не удалось получить статус. Попробуйте позже.",
        ),
        (
            httpx.HTTPError("Conn Error"),
            "Foodize API сейчас недоступен. Попробуйте чуть позже.",
        ),
    ],
)
async def test_cmd_vendor_status_http_errors(
    mocker: MockerFixture,
    message_factory: Callable[..., Message],
    error: Exception,
    expected: str,
) -> None:
    mocker.patch("handlers.start.backend_client.get_vendor_status", side_effect=error)
    message = message_factory()
    await cmd_vendor_status(message)
    answer_of(message).assert_called_with(expected)


async def test_cmd_vendor_status_success(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch(
        "handlers.start.backend_client.get_vendor_status",
        return_value={"is_vendor": True, "approval_status": "APPROVED"},
    )
    message = message_factory()
    await cmd_vendor_status(message)
    assert "одобрена" in answer_of(message).call_args[0][0]


async def test_cmd_orders_no_user_does_nothing(
    message_factory: Callable[..., Message],
) -> None:
    message = message_factory(from_user=None)
    await cmd_orders(message)
    answer_of(message).assert_not_called()


async def test_cmd_orders_not_configured(
    monkeypatch: pytest.MonkeyPatch, message_factory: Callable[..., Message]
) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "")
    message = message_factory()
    await cmd_orders(message)
    answer_of(message).assert_called_with("Просмотр заказов пока не настроен.")


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (
            _http_status_error(HTTPStatus.FORBIDDEN, "/telegram/bot/orders"),
            "Бот не прошел проверку доступа к Foodize API.",
        ),
        (
            _http_status_error(HTTPStatus.INTERNAL_SERVER_ERROR, "/telegram/bot/orders"),
            "Не удалось получить заказы. Попробуйте позже.",
        ),
        (
            httpx.HTTPError("Conn error"),
            "Foodize API сейчас недоступен. Попробуйте чуть позже.",
        ),
    ],
)
async def test_cmd_orders_http_errors(
    mocker: MockerFixture,
    message_factory: Callable[..., Message],
    error: Exception,
    expected: str,
) -> None:
    mocker.patch("handlers.start.backend_client.get_active_orders", side_effect=error)
    message = message_factory()
    await cmd_orders(message)
    answer_of(message).assert_called_with(expected)


async def test_cmd_orders_empty(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch("handlers.start.backend_client.get_active_orders", return_value=[])
    message = message_factory()
    await cmd_orders(message)
    answer_of(message).assert_called_with("Активных заказов сейчас нет.")


async def test_cmd_orders_with_orders(
    mocker: MockerFixture, message_factory: Callable[..., Message]
) -> None:
    mocker.patch(
        "handlers.start.backend_client.get_active_orders",
        return_value=[
            {
                "display_id": "123",
                "restaurant_name": "Cafe",
                "status": "COOKING",
                "total_price": 1000,
            }
        ],
    )
    message = message_factory()
    await cmd_orders(message)
    assert "Ваши активные заказы" in answer_of(message).call_args[0][0]
