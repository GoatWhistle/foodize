from collections.abc import Awaitable, Callable
from unittest.mock import AsyncMock, MagicMock

import pytest
from aiogram import Bot
from aiogram.exceptions import TelegramForbiddenError, TelegramNetworkError
from pytest_mock import MockerFixture

from config import bot_config
from notifications.events import EventPayload
from notifications.handlers import handle_order_placed, handle_order_status_changed
from utils import messages as msg

type OrderEventHandler = Callable[[EventPayload, Bot], Awaitable[None]]


@pytest.fixture(autouse=True)
def _mini_app(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "mini_app_url", "https://t.me/bot/app")


def _placed_event() -> EventPayload:
    return {
        "user_id": "user_1",
        "restaurant_name": "Cafe",
        "total_price": 50000,
        "items_count": 3,
        "order_display_id": "999",
    }


def _status_event() -> EventPayload:
    return {
        "user_id": "user_1",
        "new_status": "READY",
        "restaurant_name": "Cafe",
        "total_price": 50000,
        "order_display_id": "999",
    }


@pytest.mark.parametrize(
    ("handler", "event", "expected_substrings"),
    [
        (handle_order_placed, _placed_event(), ["Cafe", "500,00 ₽", "999"]),
        (handle_order_status_changed, _status_event(), ["Caf", msg.order_status("READY")]),
    ],
)
async def test_handler_sends_message_when_telegram_id_known(
    mocker: MockerFixture,
    handler: OrderEventHandler,
    event: EventPayload,
    expected_substrings: list[str],
) -> None:
    redis = AsyncMock()
    redis.get.return_value = "12345"
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=redis)
    bot = AsyncMock()

    await handler(event, bot)

    bot.send_message.assert_called_once()
    kwargs = bot.send_message.call_args.kwargs
    assert kwargs["chat_id"] == 12345
    for substring in expected_substrings:
        assert substring in kwargs["text"]


@pytest.mark.parametrize(
    ("handler", "event"),
    [
        (handle_order_placed, _placed_event()),
        (handle_order_status_changed, _status_event()),
    ],
)
async def test_handler_skips_when_telegram_id_unknown(
    mocker: MockerFixture, handler: OrderEventHandler, event: EventPayload
) -> None:
    redis = AsyncMock()
    redis.get.return_value = None
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=redis)
    mocker.patch("notifications.handlers.backend_client.get_telegram_id_by_user", return_value=None)
    bot = AsyncMock()

    await handler(event, bot)

    bot.send_message.assert_not_called()


@pytest.mark.parametrize(
    ("handler", "event"),
    [
        (handle_order_placed, _placed_event()),
        (handle_order_status_changed, _status_event()),
    ],
)
async def test_handler_deactivates_when_bot_blocked(
    mocker: MockerFixture, handler: OrderEventHandler, event: EventPayload
) -> None:
    redis = AsyncMock()
    redis.get.return_value = "12345"
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=redis)
    bot = AsyncMock()
    bot.send_message.side_effect = TelegramForbiddenError(method=MagicMock(), message="blocked")

    await handler(event, bot)

    redis.delete.assert_called_with("user_tg:user_1")


@pytest.mark.parametrize(
    ("handler", "event"),
    [
        (handle_order_placed, _placed_event()),
        (handle_order_status_changed, _status_event()),
    ],
)
async def test_handler_reraises_network_error(
    mocker: MockerFixture, handler: OrderEventHandler, event: EventPayload
) -> None:
    redis = AsyncMock()
    redis.get.return_value = "12345"
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=redis)
    bot = AsyncMock()
    bot.send_message.side_effect = TelegramNetworkError(method=MagicMock(), message="net")

    with pytest.raises(TelegramNetworkError):
        await handler(event, bot)


async def test_handle_order_placed_escapes_html(mocker: MockerFixture) -> None:
    redis = AsyncMock()
    redis.get.return_value = "12345"
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=redis)
    bot = AsyncMock()
    event: EventPayload = {
        "user_id": "user_1",
        "restaurant_name": "<b>Evil & Co</b>",
        "total_price": 50000,
        "items_count": 3,
        "order_display_id": "9<9&9",
    }

    await handle_order_placed(event, bot)

    text = bot.send_message.call_args.kwargs["text"]
    assert "<b>Evil & Co</b>" not in text
    assert "&lt;b&gt;Evil &amp; Co&lt;/b&gt;" in text
    assert "#9&lt;9&amp;9" in text


async def test_handle_order_status_changed_escapes_html(mocker: MockerFixture) -> None:
    redis = AsyncMock()
    redis.get.return_value = "12345"
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=redis)
    bot = AsyncMock()
    event: EventPayload = {
        "user_id": "user_1",
        "new_status": "<i>hacked</i>",
        "restaurant_name": "<b>Evil & Co</b>",
        "total_price": 50000,
        "order_display_id": "9<9&9",
    }

    await handle_order_status_changed(event, bot)

    text = bot.send_message.call_args.kwargs["text"]
    assert "<b>Evil & Co</b>" not in text
    assert "&lt;b&gt;Evil &amp; Co&lt;/b&gt;" in text
    assert "&lt;i&gt;hacked&lt;/i&gt;" in text
    assert "#9&lt;9&amp;9" in text
