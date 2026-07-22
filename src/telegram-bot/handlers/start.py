import html
import logging
from collections.abc import Awaitable, Callable
from enum import Enum, auto
from http import HTTPStatus

import httpx
from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

from config import bot_config
from filters.restart import RestartFilter
from handlers.deep_links import (
    DeepLink,
    DeepLinkKind,
    parse_deep_link,
    parse_start_arg,
)
from keyboards import start_keyboards as kb
from services import backend_client
from utils import messages as msg
from utils.formatting import format_order_line, vendor_status_text
from utils.phone import normalize_phone

router = Router()
logger = logging.getLogger(__name__)


class _BackendCallFailed(Enum):
    TOKEN = auto()


async def _call_backend_api[T](
    message: Message,
    call: Callable[[], Awaitable[T]],
    *,
    error_message: str,
    log_context: str,
) -> T | _BackendCallFailed:
    lang = msg.message_language(message)
    try:
        return await call()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == HTTPStatus.FORBIDDEN:
            await message.answer(msg.text("botAccessDenied", lang))
        else:
            logger.warning("%s HTTP error status=%s", log_context, exc.response.status_code)
            await message.answer(error_message)
    except httpx.HTTPError as exc:
        logger.warning("%s network error: %s", log_context, exc)
        await message.answer(msg.text("apiUnavailable", lang))
    return _BackendCallFailed.TOKEN


async def _ensure_bot_configured(message: Message, not_configured_message: str) -> bool:
    if bot_config.bot_api_secret:
        return True
    await message.answer(not_configured_message)
    return False


def _display_name(message: Message) -> str:
    user = message.from_user
    if not user:
        return "Telegram User"
    return user.full_name or user.username or f"Telegram {user.id}"


async def _link_phone(message: Message, phone_number: str) -> bool:
    lang = msg.message_language(message)
    from_user = message.from_user
    if not from_user:
        return False

    if not await _ensure_bot_configured(message, msg.text("botNotConfigured", lang)):
        return False

    result = await _call_backend_api(
        message,
        lambda: backend_client.link_phone(
            telegram_id=from_user.id,
            telegram_username=from_user.username,
            phone_number=phone_number,
            name=_display_name(message),
        ),
        error_message=msg.text("phoneLinkFailed", lang),
        log_context="link_phone",
    )
    if result is _BackendCallFailed.TOKEN:
        return False

    await message.answer(msg.text("phoneLinked", lang), reply_markup=kb.phone_keyboard(lang))
    mini_app_markup = kb.mini_app_keyboard(lang)
    if mini_app_markup:
        await message.answer(msg.text("openApp", lang), reply_markup=mini_app_markup)
    else:
        await message.answer(msg.text("miniAppNotConfigured", lang))
    return True


@router.message(Command("vendor_status"))
async def cmd_vendor_status(message: Message) -> None:
    lang = msg.message_language(message)
    from_user = message.from_user
    if not from_user:
        return

    if not await _ensure_bot_configured(message, msg.text("vendorStatusNotConfigured", lang)):
        return

    vendor_status = await _call_backend_api(
        message,
        lambda: backend_client.get_vendor_status(from_user.id),
        error_message=msg.text("vendorStatusError", lang),
        log_context="get_vendor_status",
    )
    if vendor_status is _BackendCallFailed.TOKEN:
        return

    await message.answer(vendor_status_text(vendor_status, lang))


@router.message(Command("orders"))
async def cmd_orders(message: Message) -> None:
    lang = msg.message_language(message)
    from_user = message.from_user
    if not from_user:
        return

    if not await _ensure_bot_configured(message, msg.text("ordersNotConfigured", lang)):
        return

    orders = await _call_backend_api(
        message,
        lambda: backend_client.get_active_orders(from_user.id),
        error_message=msg.text("ordersError", lang),
        log_context="get_active_orders",
    )
    if orders is _BackendCallFailed.TOKEN:
        return

    if not orders:
        await message.answer(msg.text("noActiveOrders", lang))
        return

    lines = [
        msg.text("activeOrdersHeader", lang),
        *(format_order_line(order, lang) for order in orders),
    ]
    await message.answer("\n".join(lines), reply_markup=kb.orders_keyboard(orders, lang))


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


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await _auto_register(message)
    link = parse_deep_link(parse_start_arg(message.text))
    await _dispatch_deep_link(message, link)


@router.message(RestartFilter())
async def handle_restart_button(message: Message) -> None:
    await cmd_start(message)


@router.message(F.contact)
async def handle_contact(message: Message) -> None:
    lang = msg.message_language(message)
    contact = message.contact
    if not contact:
        return
    if message.from_user and contact.user_id and contact.user_id != message.from_user.id:
        await message.answer(msg.text("sendOwnPhone", lang))
        return
    await _link_phone(message, normalize_phone(contact.phone_number))
