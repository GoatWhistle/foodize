from unittest.mock import MagicMock

from aiogram.types import InlineKeyboardMarkup, ReplyKeyboardMarkup

from config import bot_config
from handlers.start import (
    _display_name,
    _vendor_status_text,
)
from keyboards import start_keyboards as kbmod


def test_mini_app_keyboard() -> None:
    bot_config.mini_app_url = ""
    assert kbmod.mini_app_keyboard() is None
    bot_config.mini_app_url = "https://app.url"
    kb = kbmod.mini_app_keyboard()
    assert isinstance(kb, InlineKeyboardMarkup)


def test_restaurant_keyboard() -> None:
    bot_config.mini_app_url = ""
    assert kbmod.restaurant_keyboard("123", "Rest") is None
    bot_config.mini_app_url = "https://app.url"
    kb = kbmod.restaurant_keyboard("123", "Rest")
    assert isinstance(kb, InlineKeyboardMarkup)


def test_order_deep_link_keyboard() -> None:
    bot_config.mini_app_url = ""
    assert kbmod.order_deep_link_keyboard("123") is None
    bot_config.mini_app_url = "https://app.url"
    kb = kbmod.order_deep_link_keyboard("123")
    assert isinstance(kb, InlineKeyboardMarkup)


def test_orders_keyboard() -> None:
    bot_config.mini_app_url = ""
    assert kbmod.orders_keyboard([{"display_id": "123"}]) is None
    bot_config.mini_app_url = "https://app.url"
    kb = kbmod.orders_keyboard([{"display_id": "123"}])
    assert isinstance(kb, InlineKeyboardMarkup)
    assert kbmod.orders_keyboard([]) is None
    assert kbmod.orders_keyboard([{}]) is None


def test_phone_keyboard() -> None:
    kb = kbmod.phone_keyboard()
    assert isinstance(kb, ReplyKeyboardMarkup)


def test_display_name() -> None:
    m = MagicMock()
    m.from_user = None
    assert _display_name(m) == "Telegram User"

    u = MagicMock()
    u.full_name = "Full Name"
    m.from_user = u
    assert _display_name(m) == "Full Name"

    u.full_name = ""
    u.username = "user"
    assert _display_name(m) == "user"

    u.username = ""
    u.id = 123
    assert _display_name(m) == "Telegram 123"


def test_vendor_status_text() -> None:
    assert "профиль не найден" in _vendor_status_text({"is_vendor": False})
    assert "одобрена" in _vendor_status_text({"is_vendor": True, "approval_status": "APPROVED"})
    assert "отклонена" in _vendor_status_text({"is_vendor": True, "approval_status": "REJECTED"})
    assert "Причина: test" in _vendor_status_text(
        {"is_vendor": True, "approval_status": "REJECTED", "rejection_reason": "test"}
    )
    assert "рассмотрении" in _vendor_status_text({"is_vendor": True, "approval_status": "PENDING"})
