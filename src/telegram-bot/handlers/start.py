import re

import httpx
from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import (
    KeyboardButton,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    Message,
    WebAppInfo,
)

from config import bot_config

router = Router()

PHONE_RE = re.compile(r"^\+?[0-9][0-9\s().-]{6,20}$")
RESTART_TEXT = "🔄 Перезапустить бота"


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


def _phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=RESTART_TEXT)],
            [KeyboardButton(text="Поделиться телефоном", request_contact=True)],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
        input_field_placeholder="+79990000000",
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
        await message.answer(
            "Бот пока не настроен для регистрации: не задан TELEGRAM__BOT_API_SECRET."
        )
        return False

    payload = {
        "telegram_id": message.from_user.id,
        "telegram_username": message.from_user.username,
        "phone_number": phone_number,
        "name": _display_name(message),
    }
    headers = {"X-Telegram-Bot-Secret": bot_config.bot_api_secret}

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{bot_config.backend_url.rstrip('/')}/api/v1/telegram/bot/link-phone",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 403:
            await message.answer("Бот не прошел проверку доступа к Foodize API.")
        else:
            await message.answer(
                "Не получилось привязать телефон. Проверьте номер и попробуйте еще раз."
            )
        return False
    except httpx.HTTPError:
        await message.answer("Foodize API сейчас недоступен. Попробуйте чуть позже.")
        return False

    await message.answer(
        "Готово, телефон привязан к Telegram.\n\n"
        "Теперь можно открыть Foodize и пользоваться сервисом.",
        reply_markup=_phone_keyboard(),
    )
    mini_app_keyboard = _mini_app_keyboard()
    if mini_app_keyboard:
        await message.answer("Открыть приложение:", reply_markup=mini_app_keyboard)
    else:
        await message.answer(
            "Mini App URL пока не настроен. Задайте MINI_APP_URL в .env и в BotFather."
        )
    return True


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    await message.answer(
        "Добро пожаловать в <b>Foodize</b>!\n\n"
        "Можно сразу открыть сервис или сначала привязать номер телефона.\n"
        "Номер можно отправить кнопкой ниже или написать вручную в формате +79990000000.",
        reply_markup=_phone_keyboard(),
    )
    await message.answer(
        "Если вы уже привязали телефон, открывайте Foodize:",
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


@router.message(lambda message: bool(message.text and PHONE_RE.match(message.text.strip())))
async def handle_phone_text(message: Message) -> None:
    if not message.text:
        return
    await _link_phone(message, _normalize_phone(message.text))
