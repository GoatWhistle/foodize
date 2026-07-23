from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    WebAppInfo,
)

from config import bot_config
from i18n import DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES
from services.payloads import OrderPayload
from utils import messages as msg


def restart_text(language: str = DEFAULT_LANGUAGE) -> str:
    return msg.button("restart", language)


def restart_texts() -> set[str]:
    return {msg.button("restart", lang) for lang in SUPPORTED_LANGUAGES}


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


def mini_app_keyboard(language: str = DEFAULT_LANGUAGE) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    return web_app_keyboard(msg.button("openFoodize", language), bot_config.mini_app_url)


def restaurant_keyboard(
    display_id: str, name: str, language: str = DEFAULT_LANGUAGE
) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    button_text = (
        msg.button("openNamedRestaurant", language, name=name)
        if name
        else msg.button("openRestaurant", language)
    )
    return web_app_keyboard(button_text, restaurant_deep_link(display_id))


def order_deep_link_keyboard(
    order_display_id: str, language: str = DEFAULT_LANGUAGE
) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    return web_app_keyboard(
        f"{msg.button('openOrder', language)} #{order_display_id}",
        order_deep_link(order_display_id),
    )


def orders_keyboard(
    orders: list[OrderPayload], language: str = DEFAULT_LANGUAGE
) -> InlineKeyboardMarkup | None:
    if not bot_config.mini_app_url:
        return None
    rows = [
        [
            _web_app_button(
                f"{msg.button('openOrder', language)} #{display_id}",
                order_deep_link(str(display_id)),
            )
        ]
        for order in orders
        if (display_id := order["display_id"])
    ]
    return InlineKeyboardMarkup(inline_keyboard=rows) if rows else None


def phone_keyboard(language: str = DEFAULT_LANGUAGE) -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text=msg.button("restart", language))],
            [KeyboardButton(text=msg.button("sharePhone", language), request_contact=True)],
        ],
        resize_keyboard=True,
        one_time_keyboard=False,
    )
