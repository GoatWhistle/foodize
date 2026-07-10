import html
import logging
import re
from typing import Any, Awaitable, Callable

import httpx
from aiogram import Router
from aiogram.filters import Command, CommandStart
from services import backend_client
from utils import messages as msg
from aiogram.types import (
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    Message,
    WebAppInfo,
)

from config import bot_config
from utils.formatting import format_price, format_status

router = Router()
logger = logging.getLogger(__name__)

_UNSET = object()


async def _call_backend_api(
    message: Message,
    call: Callable[[], Awaitable[Any]],
    *,
    error_message: str,
    log_context: str,
) -> Any:
    try:
        return await call()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 403:
            await message.answer(msg.BOT_ACCESS_DENIED)
        else:
            logger.warning(
                "%s HTTP error status=%s", log_context, exc.response.status_code
            )
            await message.answer(error_message)
    except httpx.HTTPError as exc:
        logger.warning("%s network error: %s", log_context, exc)
        await message.answer(msg.API_UNAVAILABLE)
    return _UNSET


DISPLAY_ID_RE = re.compile(r"^[a-zA-Z0-9-]{1,64}$")
RESTART_TEXT = "Перезапустить бота"


def _mini_app_keyboard() -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть Foodize",
                    web_app=WebAppInfo(url=bot_config.mini_app_url),
                )
            ]
        ]
    )


def _restaurant_keyboard(display_id: str, name: str) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    url = f"{bot_config.mini_app_url.rstrip('/')}/restaurant/{display_id}"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"Открыть {name}" if name else "Открыть ресторан",
                    web_app=WebAppInfo(url=url),
                )
            ]
        ]
    )


def _order_deep_link_keyboard(order_display_id: str) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    url = f"{bot_config.mini_app_url.rstrip('/')}/orders/{order_display_id}"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"Открыть заказ #{order_display_id}",
                    web_app=WebAppInfo(url=url),
                )
            ]
        ]
    )


def _orders_keyboard(orders: list[dict]) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    buttons = []
    for order in orders:
        display_id = order.get("display_id")
        if not display_id:
            continue
        buttons.append(
            [
                InlineKeyboardButton(
                    text=f"Открыть заказ #{display_id}",
                    web_app=WebAppInfo(
                        url=f"{bot_config.mini_app_url}?startapp=order_{display_id}"
                    ),
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=buttons) if buttons else None


def _phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=RESTART_TEXT)],
            [KeyboardButton(text="Поделиться телефоном", request_contact=True)],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )


def _normalize_phone(value: str) -> str:
    value = value.strip()
    prefix = "+" if value.startswith("+") else ""
    digits = re.sub(r"\D", "", value)
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    return f"{prefix}{digits}" if prefix else f"+{digits}"


def _display_name(message: Message) -> str:
    user = message.from_user
    if not user:
        return "Telegram User"
    return user.full_name or user.username or f"Telegram {user.id}"


async def _link_phone(message: Message, phone_number: str) -> bool:
    if not message.from_user:
        return False

    if not bot_config.bot_api_secret:
        await message.answer(msg.BOT_NOT_CONFIGURED)
        return False

    result = await _call_backend_api(
        message,
        lambda: backend_client.link_phone(
            telegram_id=message.from_user.id,
            telegram_username=message.from_user.username,
            phone_number=phone_number,
            name=_display_name(message),
        ),
        error_message=msg.PHONE_LINK_FAILED,
        log_context="link_phone",
    )
    if result is _UNSET:
        return False

    await message.answer(msg.PHONE_LINKED, reply_markup=_phone_keyboard())
    mini_app_keyboard = _mini_app_keyboard()
    if mini_app_keyboard:
        await message.answer(msg.OPEN_APP, reply_markup=mini_app_keyboard)
    else:
        await message.answer(msg.MINI_APP_NOT_CONFIGURED)
    return True


def _vendor_status_text(data: dict) -> str:
    if not data.get("is_vendor"):
        return (
            "Вендор-профиль не найден.\n\n"
            "Подайте заявку на сайте Foodize, затем проверьте статус здесь."
        )

    status = data.get("approval_status")
    if status == "APPROVED":
        return "Ваша заявка вендора одобрена. Кабинет доступен на сайте Foodize."
    if status == "REJECTED":
        reason = data.get("rejection_reason")
        suffix = f"\n\nПричина: {html.escape(reason)}" if reason else ""
        return f"Заявка вендора отклонена.{suffix}"
    return "Заявка вендора на рассмотрении. Мы сообщим, когда администратор примет решение."


@router.message(Command("vendor_status"))
async def cmd_vendor_status(message: Message) -> None:
    if not message.from_user:
        return

    if not bot_config.bot_api_secret:
        await message.answer(msg.VENDOR_STATUS_NOT_CONFIGURED)
        return

    data = await _call_backend_api(
        message,
        lambda: backend_client.get_vendor_status(message.from_user.id),
        error_message=msg.VENDOR_STATUS_ERROR,
        log_context="get_vendor_status",
    )
    if data is _UNSET:
        return

    await message.answer(_vendor_status_text(data))


@router.message(Command("orders"))
async def cmd_orders(message: Message) -> None:
    if not message.from_user:
        return

    if not bot_config.bot_api_secret:
        await message.answer(msg.ORDERS_NOT_CONFIGURED)
        return

    orders = await _call_backend_api(
        message,
        lambda: backend_client.get_active_orders(message.from_user.id),
        error_message=msg.ORDERS_ERROR,
        log_context="get_active_orders",
    )
    if orders is _UNSET:
        return

    if not orders:
        await message.answer(msg.NO_ACTIVE_ORDERS)
        return

    lines = [msg.ACTIVE_ORDERS_HEADER]
    for order in orders:
        restaurant = html.escape(order.get("restaurant_name") or "ресторан")
        display_id = html.escape(str(order.get("display_id", "")))
        lines.append(
            f"• #{display_id} — {restaurant}, "
            f"{html.escape(format_status(order.get('status', '')))}, "
            f"{format_price(order.get('total_price', 0))}"
        )
    await message.answer("\n".join(lines), reply_markup=_orders_keyboard(orders))


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
        logger.info("auto-register ok: tg_id=%s username=%s", message.from_user.id, message.from_user.username)
    except httpx.HTTPStatusError as exc:
        logger.error("auto-register HTTP error status=%s", exc.response.status_code)
    except httpx.HTTPError as exc:
        logger.error("auto-register network error: %s", exc)


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    args = message.text.split(maxsplit=1)[1] if message.text and " " in message.text else ""

    await _auto_register(message)

    if args.startswith("restaurant_"):
        display_id = args[len("restaurant_") :].strip()
        if not DISPLAY_ID_RE.match(display_id):
            await message.answer("Добро пожаловать в <b>Foodize</b>!")
            return
        restaurant_name = ""
        if bot_config.backend_url and display_id:
            try:
                data = await backend_client.get_public_restaurant(display_id)
                restaurant_name = data.get("name", "")
            except Exception:
                pass
        keyboard = _restaurant_keyboard(display_id, restaurant_name)
        if keyboard:
            await message.answer(
                msg.WELCOME_RESTAURANT.format(
                    name=html.escape(restaurant_name or display_id)
                ),
                reply_markup=keyboard,
            )
        else:
            await message.answer(msg.WELCOME)
        return

    if args.startswith("order_"):
        order_display_id = args[len("order_") :].strip()
        if not order_display_id.isdigit() or len(order_display_id) > 10:
            await message.answer(msg.WELCOME)
            return
        keyboard = _order_deep_link_keyboard(order_display_id)
        if keyboard:
            await message.answer(
                f"Открыть заказ <b>#{order_display_id}</b>:",
                reply_markup=keyboard,
            )
        else:
            await message.answer(msg.WELCOME)
        return

    username = message.from_user.username if message.from_user else None
    username_hint = f"@{html.escape(username)}" if username else "без username"
    await message.answer(
        msg.WELCOME + "\n\n"
        f"Ваш аккаунт зарегистрирован как <b>{username_hint}</b>.\n"
        "Теперь вы можете войти на сайте через Telegram — просто введите свой @username.\n\n"
        "Также можно привязать номер телефона для обычного входа:",
        reply_markup=_phone_keyboard(),
        parse_mode="HTML",
    )
    await message.answer(
        "Открыть Foodize:",
        reply_markup=_mini_app_keyboard(),
    )


@router.message(lambda message: message.text == RESTART_TEXT)
async def handle_restart_button(message: Message) -> None:
    await cmd_start(message)


@router.message(lambda message: message.contact is not None)
async def handle_contact(message: Message) -> None:
    contact = message.contact
    if not contact:
        return
    if message.from_user and contact.user_id and contact.user_id != message.from_user.id:
        await message.answer("Пожалуйста, отправьте свой номер телефона.")
        return
    await _link_phone(message, _normalize_phone(contact.phone_number))
