import asyncio
import html
import logging
from typing import Any

from aiogram import Bot
from aiogram.exceptions import TelegramForbiddenError, TelegramNetworkError, TelegramRetryAfter
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from config import bot_config
from services import backend_client, redis_client
from utils.formatting import format_price, format_status

logger = logging.getLogger(__name__)

_TG_CACHE_TTL_SECONDS = 86400 * 30
_MAX_RATE_LIMIT_RETRIES = 3


class RateLimitExhaustedError(Exception):
    pass


async def _cache_telegram_id(user_id: str, telegram_id: int) -> None:
    await redis_client.get_client().set(
        f"user_tg:{user_id}", str(telegram_id), ex=_TG_CACHE_TTL_SECONDS
    )


async def _get_telegram_id(user_id: str) -> int | None:
    val = await redis_client.get_client().get(f"user_tg:{user_id}")
    if val:
        return int(val)

    telegram_id = await backend_client.get_telegram_id_by_user(user_id)
    if telegram_id is None:
        logger.warning(
            "No telegram_id for user_id=%s (cache miss and backend fallback failed)", user_id
        )
        return None

    await _cache_telegram_id(user_id, telegram_id)
    return telegram_id


async def _deactivate_telegram_id(user_id: str) -> None:
    await redis_client.get_client().delete(f"user_tg:{user_id}")
    logger.info("Deactivated Telegram binding for user_id=%s (bot blocked)", user_id)


def _order_keyboard(order_display_id: str | None) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    buttons = []
    if order_display_id:
        buttons.append(
            InlineKeyboardButton(
                text="Открыть заказ",
                web_app=WebAppInfo(
                    url=f"{bot_config.mini_app_url}?startapp=order_{order_display_id}"
                ),
            )
        )
    else:
        buttons.append(
            InlineKeyboardButton(
                text="Открыть Foodize",
                web_app=WebAppInfo(url=bot_config.mini_app_url),
            )
        )
    return InlineKeyboardMarkup(inline_keyboard=[buttons])


async def _send_notification(
    bot: Bot,
    *,
    user_id: str,
    telegram_id: int,
    text: str,
    display_id: str | None,
) -> None:
    markup = _order_keyboard(display_id)
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


async def handle_order_placed(event: dict[str, Any], bot: Bot) -> None:
    user_id = str(event.get("user_id", ""))
    telegram_id = await _get_telegram_id(user_id)
    if not telegram_id:
        return

    restaurant = html.escape(str(event.get("restaurant_name", "")))
    total = event.get("total_price", 0)
    count = event.get("items_count", 0)
    display_id = event.get("order_display_id")

    order_ref = f" <b>#{html.escape(str(display_id))}</b>" if display_id else ""
    text = (
        f"Заказ{order_ref} в <b>{restaurant}</b> принят!\n\n"
        f"Позиций: {count}\n"
        f"Сумма: {format_price(total)}\n\n"
        f"Мы уведомим вас, когда статус изменится."
    )
    await _send_notification(
        bot,
        user_id=user_id,
        telegram_id=telegram_id,
        text=text,
        display_id=display_id,
    )


async def handle_order_status_changed(event: dict[str, Any], bot: Bot) -> None:
    user_id = str(event.get("user_id", ""))
    telegram_id = await _get_telegram_id(user_id)
    if not telegram_id:
        return

    new_status = event.get("new_status", "")
    restaurant = html.escape(str(event.get("restaurant_name", "")))
    total = event.get("total_price", 0)
    display_id = event.get("order_display_id")

    order_ref = f" <b>#{html.escape(str(display_id))}</b>" if display_id else ""
    text = (
        f"Обновление заказа{order_ref} в <b>{restaurant}</b>\n\n"
        f"Статус: <b>{html.escape(format_status(new_status))}</b>\n"
        f"Сумма: {format_price(total)}"
    )
    await _send_notification(
        bot,
        user_id=user_id,
        telegram_id=telegram_id,
        text=text,
        display_id=display_id,
    )
