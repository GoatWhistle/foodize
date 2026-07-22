from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from _pytest.logging import LogCaptureFixture
from aiogram.exceptions import (
    TelegramForbiddenError,
    TelegramNetworkError,
    TelegramRetryAfter,
)
from aiogram.types import InlineKeyboardMarkup
from pytest_mock import MockerFixture

from config import bot_config
from exceptions import RateLimitExhaustedError
from notifications.handlers import (
    _deactivate_telegram_id,
    _get_telegram_id,
    _order_keyboard,
    _send_notification,
    handle_order_placed,
    handle_order_status_changed,
)
from utils import messages as msg


@pytest.fixture(autouse=True)
def _mini_app(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "mini_app_url", "https://t.me/bot/app")


def _placed_event() -> dict[str, Any]:
    return {
        "user_id": "user_1",
        "restaurant_name": "Cafe",
        "total_price": 50000,
        "items_count": 3,
        "order_display_id": "999",
    }


def _status_event() -> dict[str, Any]:
    return {
        "user_id": "user_1",
        "new_status": "READY",
        "restaurant_name": "Cafe",
        "total_price": 50000,
        "order_display_id": "999",
    }


async def test_get_telegram_id_from_cache(mocker: MockerFixture) -> None:
    mock_client = AsyncMock()
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=mock_client)
    mock_fallback = mocker.patch("notifications.handlers.backend_client.get_telegram_id_by_user")
    mock_client.get.return_value = "12345"

    res = await _get_telegram_id("user_1")

    assert res == 12345
    mock_client.get.assert_called_with("user_tg:user_1")
    mock_fallback.assert_not_called()


async def test_get_telegram_id_fallback_and_recache(mocker: MockerFixture) -> None:
    mock_client = AsyncMock()
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=mock_client)
    mock_client.get.return_value = None
    mock_fallback = mocker.patch(
        "notifications.handlers.backend_client.get_telegram_id_by_user",
        return_value=98765,
    )

    res = await _get_telegram_id("user_2")

    assert res == 98765
    mock_fallback.assert_awaited_once_with("user_2")
    args, _kwargs = mock_client.set.call_args
    assert args[0] == "user_tg:user_2"
    assert args[1] == "98765"


async def test_get_telegram_id_missing_logs_warning(
    mocker: MockerFixture, caplog: LogCaptureFixture
) -> None:
    mock_client = AsyncMock()
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=mock_client)
    mock_client.get.return_value = None
    mocker.patch(
        "notifications.handlers.backend_client.get_telegram_id_by_user",
        return_value=None,
    )

    with caplog.at_level("WARNING"):
        res = await _get_telegram_id("user_3")

    assert res is None
    assert any("user_3" in r.message for r in caplog.records)


async def test_deactivate_telegram_id(mocker: MockerFixture) -> None:
    mock_client = AsyncMock()
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=mock_client)

    await _deactivate_telegram_id("user_1")

    mock_client.delete.assert_called_with("user_tg:user_1")


def test_order_keyboard_none_without_mini_app(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "mini_app_url", "")
    assert _order_keyboard("123") is None


def test_order_keyboard_with_display_id() -> None:
    kb = _order_keyboard("123")
    assert isinstance(kb, InlineKeyboardMarkup)
    button = kb.inline_keyboard[0][0]
    assert button.text == msg.button("openOrder")
    assert button.web_app is not None
    assert button.web_app.url == "https://t.me/bot/app?startapp=order_123"


def test_order_keyboard_without_display_id() -> None:
    kb = _order_keyboard(None)
    assert isinstance(kb, InlineKeyboardMarkup)
    button = kb.inline_keyboard[0][0]
    assert button.text == msg.button("openFoodize")
    assert button.web_app is not None
    assert button.web_app.url == "https://t.me/bot/app"


async def test_send_notification_retries_after_rate_limit(mocker: MockerFixture) -> None:
    mocker.patch("notifications.handlers.asyncio.sleep")
    bot = AsyncMock()
    bot.send_message.side_effect = [
        TelegramRetryAfter(method=MagicMock(), message="flood", retry_after=1),
        None,
    ]

    await _send_notification(bot, user_id="user_1", telegram_id=12345, text="hi", display_id="9")

    assert bot.send_message.call_count == 2


async def test_send_notification_raises_when_rate_limit_exhausted(mocker: MockerFixture) -> None:
    mocker.patch("notifications.handlers.asyncio.sleep")
    bot = AsyncMock()
    bot.send_message.side_effect = TelegramRetryAfter(
        method=MagicMock(), message="flood", retry_after=1
    )

    with pytest.raises(RateLimitExhaustedError):
        await _send_notification(
            bot, user_id="user_1", telegram_id=12345, text="hi", display_id="9"
        )


async def test_send_notification_forbidden_deactivates(mocker: MockerFixture) -> None:
    mocker.patch("notifications.handlers.asyncio.sleep")
    redis = AsyncMock()
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=redis)
    bot = AsyncMock()
    bot.send_message.side_effect = [
        TelegramRetryAfter(method=MagicMock(), message="flood", retry_after=1),
        TelegramForbiddenError(method=MagicMock(), message="blocked"),
    ]

    await _send_notification(bot, user_id="user_1", telegram_id=12345, text="hi", display_id="9")

    redis.delete.assert_called_with("user_tg:user_1")


@pytest.mark.parametrize(
    ("handler", "event", "expected_substrings"),
    [
        (handle_order_placed, _placed_event(), ["Cafe", "500,00 ₽", "999"]),
        (handle_order_status_changed, _status_event(), ["Caf", msg.order_status("READY")]),
    ],
)
async def test_handler_sends_message_when_telegram_id_known(
    mocker: MockerFixture,
    handler: Any,
    event: dict[str, Any],
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
    mocker: MockerFixture, handler: Any, event: dict[str, Any]
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
    mocker: MockerFixture, handler: Any, event: dict[str, Any]
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
    mocker: MockerFixture, handler: Any, event: dict[str, Any]
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
    event = {
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
    event = {
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
