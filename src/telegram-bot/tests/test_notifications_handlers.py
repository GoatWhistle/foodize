from unittest.mock import AsyncMock, MagicMock

import pytest
from aiogram.exceptions import (
    TelegramForbiddenError,
    TelegramNetworkError,
    TelegramRetryAfter,
)
from aiogram.types import InlineKeyboardMarkup

from config import bot_config
from notifications.handlers import (
    RateLimitExhaustedError,
    _deactivate_telegram_id,
    _get_telegram_id,
    _order_keyboard,
    _send_notification,
    handle_order_placed,
    handle_order_status_changed,
)


@pytest.mark.asyncio
async def test_get_telegram_id_from_cache(mocker):
    mock_client = AsyncMock()
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=mock_client)
    mock_fallback = mocker.patch("notifications.handlers.backend_client.get_telegram_id_by_user")

    mock_client.get.return_value = "12345"
    res = await _get_telegram_id("user_1")
    assert res == 12345
    mock_client.get.assert_called_with("user_tg:user_1")
    mock_fallback.assert_not_called()


@pytest.mark.asyncio
async def test_get_telegram_id_fallback_and_recache(mocker):
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
    mock_client.set.assert_awaited_once()
    args, kwargs = mock_client.set.call_args
    assert args[0] == "user_tg:user_2"
    assert args[1] == "98765"


@pytest.mark.asyncio
async def test_get_telegram_id_missing_logs_warning(mocker, caplog):
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


@pytest.mark.asyncio
async def test_deactivate_telegram_id(mocker):
    mock_client = AsyncMock()
    mocker.patch("notifications.handlers.redis_client.get_client", return_value=mock_client)

    await _deactivate_telegram_id("user_1")
    mock_client.delete.assert_called_with("user_tg:user_1")


def test_order_keyboard():
    bot_config.mini_app_url = ""
    assert _order_keyboard("123") is None

    bot_config.mini_app_url = "https://t.me/bot/app"

    kb = _order_keyboard("123")
    assert isinstance(kb, InlineKeyboardMarkup)
    assert kb.inline_keyboard[0][0].text == "Открыть заказ"
    assert kb.inline_keyboard[0][0].web_app.url == "https://t.me/bot/app?startapp=order_123"

    kb2 = _order_keyboard(None)
    assert isinstance(kb2, InlineKeyboardMarkup)
    assert kb2.inline_keyboard[0][0].text == "Открыть Foodize"
    assert kb2.inline_keyboard[0][0].web_app.url == "https://t.me/bot/app"


@pytest.mark.asyncio
async def test_send_notification_retries_after_rate_limit(mocker):
    mocker.patch("notifications.handlers.asyncio.sleep")
    bot = AsyncMock()
    bot_config.mini_app_url = "https://t.me/bot/app"
    bot.send_message.side_effect = [
        TelegramRetryAfter(method=MagicMock(), message="flood", retry_after=1),
        None,
    ]

    await _send_notification(bot, user_id="user_1", telegram_id=12345, text="hi", display_id="9")
    assert bot.send_message.call_count == 2


@pytest.mark.asyncio
async def test_send_notification_raises_when_rate_limit_exhausted(mocker):
    mocker.patch("notifications.handlers.asyncio.sleep")
    bot = AsyncMock()
    bot_config.mini_app_url = "https://t.me/bot/app"
    bot.send_message.side_effect = TelegramRetryAfter(
        method=MagicMock(), message="flood", retry_after=1
    )

    with pytest.raises(RateLimitExhaustedError):
        await _send_notification(
            bot, user_id="user_1", telegram_id=12345, text="hi", display_id="9"
        )


@pytest.mark.asyncio
async def test_send_notification_forbidden_during_retry(mocker):
    mocker.patch("notifications.handlers.asyncio.sleep")
    mock_deactivate = mocker.patch("notifications.handlers._deactivate_telegram_id")
    bot = AsyncMock()
    bot_config.mini_app_url = "https://t.me/bot/app"
    bot.send_message.side_effect = [
        TelegramRetryAfter(method=MagicMock(), message="flood", retry_after=1),
        TelegramForbiddenError(method=MagicMock(), message="blocked"),
    ]

    await _send_notification(bot, user_id="user_1", telegram_id=12345, text="hi", display_id="9")
    mock_deactivate.assert_called_once_with("user_1")


@pytest.mark.asyncio
async def test_handle_order_placed(mocker):
    mock_get_tg = mocker.patch("notifications.handlers._get_telegram_id")
    mock_deactivate = mocker.patch("notifications.handlers._deactivate_telegram_id")
    bot = AsyncMock()
    bot_config.mini_app_url = "https://t.me/bot/app"

    mock_get_tg.return_value = None
    event = {
        "user_id": "user_1",
        "restaurant_name": "Cafe",
        "total_price": 50000,
        "items_count": 3,
        "order_display_id": "999",
    }
    await handle_order_placed(event, bot)
    bot.send_message.assert_not_called()

    mock_get_tg.return_value = 12345
    await handle_order_placed(event, bot)
    bot.send_message.assert_called_once()
    args, kwargs = bot.send_message.call_args
    assert kwargs["chat_id"] == 12345
    assert "Cafe" in kwargs["text"]
    assert "500,00 ₽" in kwargs["text"]
    assert "999" in kwargs["text"]
    assert kwargs["reply_markup"] is not None

    bot.send_message.reset_mock()
    bot.send_message.side_effect = TelegramForbiddenError(method=MagicMock(), message="Bot blocked")
    await handle_order_placed(event, bot)
    mock_deactivate.assert_called_once_with("user_1")

    bot.send_message.reset_mock()
    bot.send_message.side_effect = TelegramNetworkError(method=MagicMock(), message="Network error")
    with pytest.raises(TelegramNetworkError):
        await handle_order_placed(event, bot)


@pytest.mark.asyncio
async def test_handle_order_status_changed(mocker):
    mock_get_tg = mocker.patch("notifications.handlers._get_telegram_id")
    mock_deactivate = mocker.patch("notifications.handlers._deactivate_telegram_id")
    bot = AsyncMock()
    bot_config.mini_app_url = "https://t.me/bot/app"

    mock_get_tg.return_value = None
    event = {
        "user_id": "user_1",
        "new_status": "READY",
        "restaurant_name": "Cafe",
        "total_price": 50000,
        "order_display_id": "999",
    }
    await handle_order_status_changed(event, bot)
    bot.send_message.assert_not_called()

    mock_get_tg.return_value = 12345
    await handle_order_status_changed(event, bot)
    bot.send_message.assert_called_once()
    args, kwargs = bot.send_message.call_args
    assert kwargs["chat_id"] == 12345
    assert "Caf" in kwargs["text"]
    assert "Готов к выдаче" in kwargs["text"]

    bot.send_message.reset_mock()
    bot.send_message.side_effect = TelegramForbiddenError(method=MagicMock(), message="Bot blocked")
    await handle_order_status_changed(event, bot)
    mock_deactivate.assert_called_once_with("user_1")

    bot.send_message.reset_mock()
    bot.send_message.side_effect = TelegramNetworkError(method=MagicMock(), message="Network error")
    with pytest.raises(TelegramNetworkError):
        await handle_order_status_changed(event, bot)


@pytest.mark.asyncio
async def test_handle_order_placed_escapes_html(mocker):
    mock_get_tg = mocker.patch("notifications.handlers._get_telegram_id")
    mock_get_tg.return_value = 12345
    bot = AsyncMock()
    bot_config.mini_app_url = "https://t.me/bot/app"

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


@pytest.mark.asyncio
async def test_handle_order_status_changed_escapes_html(mocker):
    mock_get_tg = mocker.patch("notifications.handlers._get_telegram_id")
    mock_get_tg.return_value = 12345
    bot = AsyncMock()
    bot_config.mini_app_url = "https://t.me/bot/app"

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
