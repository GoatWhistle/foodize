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
OPEN_FOODIZE_BUTTON = "Открыть Foodize"
OPEN_ORDER_BUTTON = "Открыть заказ"
_OPEN_RESTAURANT_BUTTON = "Открыть ресторан"
_SHARE_PHONE_BUTTON = "Поделиться телефоном"


def _mini_app_base() -> str:
    return bot_config.mini_app_url.rstrip("/")


def restaurant_deep_link(display_id: str) -> str:
    return f"{_mini_app_base()}/restaurant/{display_id}"


def order_deep_link(order_display_id: str) -> str:
    return f"{_mini_app_base()}/orders/{order_display_id}"


def _web_app_button(text: str, url: str) -> InlineKeyboardButton:
    return InlineKeyboardButton(text=text, web_app=WebAppInfo(url=url))


def web_app_keyboard(text: str, url: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[_web_app_button(text, url)]])


def mini_app_keyboard() -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    return web_app_keyboard(OPEN_FOODIZE_BUTTON, bot_config.mini_app_url)


def restaurant_keyboard(display_id: str, name: str) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    button_text = f"Открыть {name}" if name else _OPEN_RESTAURANT_BUTTON
    return web_app_keyboard(button_text, restaurant_deep_link(display_id))


def order_deep_link_keyboard(order_display_id: str) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    return web_app_keyboard(
        f"{OPEN_ORDER_BUTTON} #{order_display_id}", order_deep_link(order_display_id)
    )


def orders_keyboard(orders: list[dict[str, Any]]) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    rows = [
        [_web_app_button(f"{OPEN_ORDER_BUTTON} #{display_id}", order_deep_link(str(display_id)))]
        for order in orders
        if (display_id := order.get("display_id"))
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows) if rows else None


def phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=RESTART_TEXT)],
            [KeyboardButton(text=_SHARE_PHONE_BUTTON, request_contact=True)],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )
