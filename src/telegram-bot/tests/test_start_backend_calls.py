from http import HTTPStatus

import httpx
import pytest
from pytest_mock import MockerFixture

from config import bot_config
from handlers.start import (
    _link_phone,
    cmd_orders,
    cmd_vendor_status,
)
from tests.conftest import MessageFactory, answer_of
from utils import messages as msg


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
    monkeypatch: pytest.MonkeyPatch, message_factory: MessageFactory
) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "")
    message = message_factory()

    res = await _link_phone(message, "+79990000000")

    assert res is False
    answer_of(message).assert_called_with(
        msg.text("botNotConfigured")
    )


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (
            _http_status_error(HTTPStatus.FORBIDDEN, "/telegram/bot/link-phone"),
            msg.text("botAccessDenied"),
        ),
        (
            _http_status_error(HTTPStatus.INTERNAL_SERVER_ERROR, "/telegram/bot/link-phone"),
            msg.text("phoneLinkFailed"),
        ),
        (
            httpx.HTTPError("Conn Error"),
            msg.text("apiUnavailable"),
        ),
    ],
)
async def test_link_phone_http_errors(
    mocker: MockerFixture,
    message_factory: MessageFactory,
    error: Exception,
    expected: str,
) -> None:
    mocker.patch("handlers.start.backend_client.link_phone", side_effect=error)
    message = message_factory()

    res = await _link_phone(message, "+79990000000")

    assert res is False
    answer_of(message).assert_called_with(expected)


async def test_link_phone_success(
    mocker: MockerFixture, message_factory: MessageFactory
) -> None:
    mocker.patch("handlers.start.backend_client.link_phone", return_value=None)
    message = message_factory()

    res = await _link_phone(message, "+79990000000")

    assert res is True
    assert answer_of(message).call_count == 2


async def test_cmd_vendor_status_no_user_does_nothing(
    message_factory: MessageFactory,
) -> None:
    message = message_factory(from_user=None)
    await cmd_vendor_status(message)
    answer_of(message).assert_not_called()


async def test_cmd_vendor_status_not_configured(
    monkeypatch: pytest.MonkeyPatch, message_factory: MessageFactory
) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "")
    message = message_factory()
    await cmd_vendor_status(message)
    answer_of(message).assert_called_with(msg.text("vendorStatusNotConfigured"))


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (
            _http_status_error(HTTPStatus.FORBIDDEN, "/telegram/bot/vendor-status"),
            msg.text("botAccessDenied"),
        ),
        (
            _http_status_error(HTTPStatus.INTERNAL_SERVER_ERROR, "/telegram/bot/vendor-status"),
            msg.text("vendorStatusError"),
        ),
        (
            httpx.HTTPError("Conn Error"),
            msg.text("apiUnavailable"),
        ),
    ],
)
async def test_cmd_vendor_status_http_errors(
    mocker: MockerFixture,
    message_factory: MessageFactory,
    error: Exception,
    expected: str,
) -> None:
    mocker.patch("handlers.start.backend_client.get_vendor_status", side_effect=error)
    message = message_factory()
    await cmd_vendor_status(message)
    answer_of(message).assert_called_with(expected)


async def test_cmd_vendor_status_success(
    mocker: MockerFixture, message_factory: MessageFactory
) -> None:
    mocker.patch(
        "handlers.start.backend_client.get_vendor_status",
        return_value={"is_vendor": True, "approval_status": "APPROVED"},
    )
    message = message_factory()
    await cmd_vendor_status(message)
    assert msg.text("vendorApproved") in answer_of(message).call_args[0][0]


async def test_cmd_orders_no_user_does_nothing(
    message_factory: MessageFactory,
) -> None:
    message = message_factory(from_user=None)
    await cmd_orders(message)
    answer_of(message).assert_not_called()


async def test_cmd_orders_not_configured(
    monkeypatch: pytest.MonkeyPatch, message_factory: MessageFactory
) -> None:
    monkeypatch.setattr(bot_config, "bot_api_secret", "")
    message = message_factory()
    await cmd_orders(message)
    answer_of(message).assert_called_with(msg.text("ordersNotConfigured"))


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (
            _http_status_error(HTTPStatus.FORBIDDEN, "/telegram/bot/orders"),
            msg.text("botAccessDenied"),
        ),
        (
            _http_status_error(HTTPStatus.INTERNAL_SERVER_ERROR, "/telegram/bot/orders"),
            msg.text("ordersError"),
        ),
        (
            httpx.HTTPError("Conn error"),
            msg.text("apiUnavailable"),
        ),
    ],
)
async def test_cmd_orders_http_errors(
    mocker: MockerFixture,
    message_factory: MessageFactory,
    error: Exception,
    expected: str,
) -> None:
    mocker.patch("handlers.start.backend_client.get_active_orders", side_effect=error)
    message = message_factory()
    await cmd_orders(message)
    answer_of(message).assert_called_with(expected)


async def test_cmd_orders_empty(
    mocker: MockerFixture, message_factory: MessageFactory
) -> None:
    mocker.patch("handlers.start.backend_client.get_active_orders", return_value=[])
    message = message_factory()
    await cmd_orders(message)
    answer_of(message).assert_called_with(msg.text("noActiveOrders"))


async def test_cmd_orders_with_orders(
    mocker: MockerFixture, message_factory: MessageFactory
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
    assert msg.text("activeOrdersHeader") in answer_of(message).call_args[0][0]
