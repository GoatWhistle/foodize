from collections.abc import Callable

import pytest
from aiogram.types import InlineKeyboardMarkup, Message, ReplyKeyboardMarkup

from config import bot_config
from handlers.start import _display_name
from keyboards import start_keyboards as kbmod
from tests.conftest import make_user
from utils.formatting import vendor_status_text


@pytest.fixture
def with_mini_app(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "mini_app_url", "https://app.url")


@pytest.fixture
def without_mini_app(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(bot_config, "mini_app_url", "")


def test_mini_app_keyboard_none_without_url(without_mini_app: None) -> None:
    assert kbmod.mini_app_keyboard() is None


def test_mini_app_keyboard_with_url(with_mini_app: None) -> None:
    assert isinstance(kbmod.mini_app_keyboard(), InlineKeyboardMarkup)


def test_restaurant_keyboard_none_without_url(without_mini_app: None) -> None:
    assert kbmod.restaurant_keyboard("123", "Rest") is None


def test_restaurant_keyboard_with_url(with_mini_app: None) -> None:
    assert isinstance(kbmod.restaurant_keyboard("123", "Rest"), InlineKeyboardMarkup)


def test_order_deep_link_keyboard_none_without_url(without_mini_app: None) -> None:
    assert kbmod.order_deep_link_keyboard("123") is None


def test_order_deep_link_keyboard_with_url(with_mini_app: None) -> None:
    assert isinstance(kbmod.order_deep_link_keyboard("123"), InlineKeyboardMarkup)


def test_orders_keyboard_none_without_url(without_mini_app: None) -> None:
    assert kbmod.orders_keyboard([{"display_id": "123"}]) is None


def test_orders_keyboard_with_url(with_mini_app: None) -> None:
    kb = kbmod.orders_keyboard([{"display_id": "123"}])
    assert isinstance(kb, InlineKeyboardMarkup)
    assert kbmod.orders_keyboard([]) is None
    assert kbmod.orders_keyboard([{}]) is None


def test_phone_keyboard() -> None:
    assert isinstance(kbmod.phone_keyboard(), ReplyKeyboardMarkup)


@pytest.mark.parametrize(
    ("full_name", "username", "user_id", "expected"),
    [
        ("Full Name", "user", 123, "Full Name"),
        ("", "user", 123, "user"),
        ("", "", 123, "Telegram 123"),
    ],
)
def test_display_name_with_user(
    message_factory: Callable[..., Message],
    full_name: str,
    username: str,
    user_id: int,
    expected: str,
) -> None:
    user = make_user(user_id=user_id, username=username or None, full_name=full_name or "x")
    if not full_name:
        object.__setattr__(user, "first_name", "")
        object.__setattr__(user, "last_name", None)
    message = message_factory(from_user=user)
    assert _display_name(message) == expected


def test_display_name_without_user(message_factory: Callable[..., Message]) -> None:
    message = message_factory(from_user=None)
    assert _display_name(message) == "Telegram User"


def test_vendor_status_text() -> None:
    assert "профиль не найден" in vendor_status_text({"is_vendor": False})
    assert "одобрена" in vendor_status_text({"is_vendor": True, "approval_status": "APPROVED"})
    assert "отклонена" in vendor_status_text({"is_vendor": True, "approval_status": "REJECTED"})
    assert "Причина: test" in vendor_status_text(
        {"is_vendor": True, "approval_status": "REJECTED", "rejection_reason": "test"}
    )
    assert "рассмотрении" in vendor_status_text({"is_vendor": True, "approval_status": "PENDING"})
