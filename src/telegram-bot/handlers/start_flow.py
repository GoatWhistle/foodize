import html
import logging

import httpx
from aiogram.types import Message

from config import bot_config
from handlers.backend_calls import _display_name
from handlers.deep_links import DeepLink, DeepLinkKind
from keyboards import start_keyboards as kb
from services import backend_client
from utils import messages as msg

logger = logging.getLogger(__name__)


async def _auto_register(message: Message) -> None:
    if not message.from_user:
        return
    if not bot_config.bot_api_secret:
        logger.warning("bot_api_secret not set, skipping auto-register")
        return
    try:
        await backend_client.register_by_telegram(
            telegram_id=message.from_user.id,
            telegram_username=message.from_user.username,
            name=_display_name(message),
        )
        logger.info(
            "auto-register ok: tg_id=%s username=%s",
            message.from_user.id,
            message.from_user.username,
        )
    except httpx.HTTPStatusError as exc:
        logger.error("auto-register HTTP error status=%s", exc.response.status_code)
    except httpx.HTTPError as exc:
        logger.error("auto-register network error: %s", exc)


async def _handle_restaurant_link(message: Message, display_id: str) -> None:
    lang = msg.message_language(message)
    restaurant_name = ""
    if bot_config.backend_url:
        try:
            restaurant = await backend_client.get_public_restaurant(display_id)
            restaurant_name = restaurant.get("name", "")
        except httpx.HTTPError as exc:
            logger.warning(
                "Failed to fetch restaurant name for display_id=%s: %s",
                display_id,
                exc,
            )
    keyboard = kb.restaurant_keyboard(display_id, restaurant_name, lang)
    if not keyboard:
        await message.answer(msg.text("welcome", lang))
        return
    await message.answer(
        msg.text("welcomeRestaurant", lang, name=html.escape(restaurant_name or display_id)),
        reply_markup=keyboard,
    )


async def _handle_order_link(message: Message, order_display_id: str) -> None:
    lang = msg.message_language(message)
    keyboard = kb.order_deep_link_keyboard(order_display_id, lang)
    if not keyboard:
        await message.answer(msg.text("welcome", lang))
        return
    await message.answer(
        msg.text("openOrder", lang, display_id=order_display_id),
        reply_markup=keyboard,
    )


async def _handle_default_start(message: Message) -> None:
    lang = msg.message_language(message)
    username = message.from_user.username if message.from_user else None
    username_hint = f"@{html.escape(username)}" if username else msg.text("noUsername", lang)
    await message.answer(
        msg.text("welcome", lang)
        + msg.text("welcomeRegistered", lang, username_hint=username_hint),
        reply_markup=kb.phone_keyboard(lang),
    )
    await message.answer(msg.text("openFoodize", lang), reply_markup=kb.mini_app_keyboard(lang))


async def _dispatch_deep_link(message: Message, link: DeepLink) -> None:
    lang = msg.message_language(message)
    if link.kind is DeepLinkKind.RESTAURANT:
        await _handle_restaurant_link(message, link.value)
    elif link.kind is DeepLinkKind.ORDER:
        await _handle_order_link(message, link.value)
    elif link.kind is DeepLinkKind.INVALID:
        await message.answer(msg.text("welcome", lang))
    else:
        await _handle_default_start(message)
