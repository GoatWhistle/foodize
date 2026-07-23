import logging

from aiogram import F, Router
from aiogram.filters import Command, CommandStart
from aiogram.types import Message

from filters.restart import RestartFilter
from handlers.backend_calls import (
    _BackendCallFailed,
    _call_backend_api,
    _display_name,
    _ensure_bot_configured,
)
from handlers.deep_links import parse_deep_link, parse_start_arg
from handlers.start_flow import _auto_register, _dispatch_deep_link
from keyboards import start_keyboards as kb
from services import backend_client
from utils import messages as msg
from utils.formatting import format_order_line, vendor_status_text
from utils.phone import normalize_phone

router = Router()
logger = logging.getLogger(__name__)


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
