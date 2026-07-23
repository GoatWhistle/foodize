from unittest.mock import AsyncMock, MagicMock

import pytest
from _pytest.logging import LogCaptureFixture
from aiogram.exceptions import TelegramForbiddenError, TelegramRetryAfter
from aiogram.types import InlineKeyboardMarkup
from pytest_mock import MockerFixture

from config import bot_config
from exceptions import RateLimitExhaustedError
from notifications.handlers import (
    _deactivate_telegram_id,
    _get_telegram_id,
    _order_keyboard,
    _send_notification,
)
from utils import messages as msg


@pytest.fixture(autouse=True)
def _mini_app(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "mini_app_url", "https://t.me/bot/app")


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
