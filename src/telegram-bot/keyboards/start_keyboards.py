from typing import Any

from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from config import bot_config

RESTART_TEXT = "Перезапустить бота"


def _mini_app_base() -> str:
    return bot_config.mini_app_url.rstrip("/")


def restaurant_deep_link(display_id: str) -> str:
    return f"{_mini_app_base()}/restaurant/{display_id}"


def order_deep_link(order_display_id: str) -> str:
    return f"{_mini_app_base()}/orders/{order_display_id}"


def mini_app_keyboard() -> InlineKeyboardMarkup | None:
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


def restaurant_keyboard(display_id: str, name: str) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"Открыть {name}" if name else "Открыть ресторан",
                    web_app=WebAppInfo(url=restaurant_deep_link(display_id)),
                )
            ]
        ]
    )


def order_deep_link_keyboard(order_display_id: str) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"Открыть заказ #{order_display_id}",
                    web_app=WebAppInfo(url=order_deep_link(order_display_id)),
                )
            ]
        ]
    )


def orders_keyboard(orders: list[dict[str, Any]]) -> InlineKeyboardMarkup | None:
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
                    web_app=WebAppInfo(url=order_deep_link(str(display_id))),
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=buttons) if buttons else None


def phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=RESTART_TEXT)],
            [KeyboardButton(text="Поделиться телефоном", request_contact=True)],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )
