from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from config import bot_config

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message) -> None:
    rows = []
    if bot_config.mini_app_url:
        rows.append(
            [
                InlineKeyboardButton(
                    text="Открыть Foodize",
                    web_app=WebAppInfo(url=bot_config.mini_app_url),
                )
            ]
        )
    await message.answer(
        "Добро пожаловать в <b>Foodize</b>!\n\n"
        "Заказывайте еду из лучших ресторанов прямо в Telegram.",
        reply_markup=InlineKeyboardMarkup(inline_keyboard=rows) if rows else None,
    )
