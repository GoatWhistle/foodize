import asyncio
import html
import logging
from collections.abc import Callable
from typing import Any

from aiogram import Bot
from aiogram.exceptions import TelegramForbiddenError, TelegramNetworkError, TelegramRetryAfter
from aiogram.types import InlineKeyboardMarkup

from config import bot_config
from exceptions import RateLimitExhaustedError
from i18n import DEFAULT_LANGUAGE, normalize_language
from keyboards.start_keyboards import web_app_keyboard
from services import backend_client, redis_client
from utils import messages as msg
from utils.formatting import format_price, format_status

logger = logging.getLogger(__name__)

_TG_CACHE_TTL_SECONDS = 86400 * 30
_MAX_RATE_LIMIT_RETRIES = 3


def _tg_cache_key(user_id: str) -> str:
    return f"user_tg:{user_id}"


async def _cache_telegram_id(user_id: str, telegram_id: int) -> None:
    await redis_client.get_client().set(
        _tg_cache_key(user_id), str(telegram_id), ex=_TG_CACHE_TTL_SECONDS
    )


async def _get_telegram_id(user_id: str) -> int | None:
    cached_id = await redis_client.get_client().get(_tg_cache_key(user_id))
    if cached_id:
        return int(cached_id)

    telegram_id = await backend_client.get_telegram_id_by_user(user_id)
    if telegram_id is None:
        logger.warning(
            "No telegram_id for user_id=%s (cache miss and backend fallback failed)", user_id
        )
        return None

    await _cache_telegram_id(user_id, telegram_id)
    return telegram_id


async def _deactivate_telegram_id(user_id: str) -> None:
    await redis_client.get_client().delete(_tg_cache_key(user_id))
    logger.info("Deactivated Telegram binding for user_id=%s (bot blocked)", user_id)


def _order_keyboard(
    order_display_id: str | None, language: str = DEFAULT_LANGUAGE
) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    if order_display_id:
        return web_app_keyboard(
            msg.button("openOrder", language),
            f"{bot_config.mini_app_url}?startapp=order_{order_display_id}",
        )
    return web_app_keyboard(msg.button("openFoodize", language), bot_config.mini_app_url)


async def _send_notification(
    bot: Bot,
    *,
    user_id: str,
    telegram_id: int,
    text: str,
    display_id: str | None,
    language: str = DEFAULT_LANGUAGE,
) -> None:
    markup = _order_keyboard(display_id, language)
    for attempt in range(_MAX_RATE_LIMIT_RETRIES):
        try:
            await bot.send_message(chat_id=telegram_id, text=text, reply_markup=markup)
            return
        except TelegramForbiddenError:
            logger.info("User %s blocked the bot, deactivating binding", user_id)
            await _deactivate_telegram_id(user_id)
            return
        except TelegramRetryAfter as exc:
            logger.warning(
                "Rate limited by Telegram (attempt %d/%d), retrying after %ss",
                attempt + 1,
                _MAX_RATE_LIMIT_RETRIES,
                exc.retry_after,
            )
            await asyncio.sleep(exc.retry_after)
        except TelegramNetworkError as exc:
            logger.warning("Telegram network error, will retry via queue: %s", exc)
            raise
    logger.error("Exhausted rate-limit retries for user %s, will retry via queue", user_id)
    raise RateLimitExhaustedError(user_id)


def _event_language(event: dict[str, Any]) -> str:
    return normalize_language(event.get("language"))


def _order_ref(display_id: object) -> str:
    return f" <b>#{html.escape(str(display_id))}</b>" if display_id else ""


def _order_placed_text(event: dict[str, Any]) -> str:
    language = _event_language(event)
    return msg.notification(
        "orderPlaced",
        language,
        order_ref=_order_ref(event.get("order_display_id")),
        restaurant=html.escape(str(event.get("restaurant_name", ""))),
        items_count=event.get("items_count", 0),
        total=format_price(event.get("total_price", 0)),
    )


def _order_status_text(event: dict[str, Any]) -> str:
    language = _event_language(event)
    return msg.notification(
        "orderStatusChanged",
        language,
        order_ref=_order_ref(event.get("order_display_id")),
        restaurant=html.escape(str(event.get("restaurant_name", ""))),
        status=html.escape(format_status(event.get("new_status", ""), language)),
        total=format_price(event.get("total_price", 0)),
    )


async def _notify_user(
    event: dict[str, Any],
    bot: Bot,
    build_text: Callable[[dict[str, Any]], str],
) -> None:
    user_id = str(event.get("user_id", ""))
    telegram_id = await _get_telegram_id(user_id)
    if not telegram_id:
        return
    await _send_notification(
        bot,
        user_id=user_id,
        telegram_id=telegram_id,
        text=build_text(event),
        display_id=event.get("order_display_id"),
        language=_event_language(event),
    )


async def handle_order_placed(event: dict[str, Any], bot: Bot) -> None:
    await _notify_user(event, bot, _order_placed_text)


async def handle_order_status_changed(event: dict[str, Any], bot: Bot) -> None:
    await _notify_user(event, bot, _order_status_text)
