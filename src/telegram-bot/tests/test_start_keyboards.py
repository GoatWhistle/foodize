import pytest
from aiogram.types import InlineKeyboardMarkup, ReplyKeyboardMarkup

from config import bot_config
from handlers.backend_calls import _display_name
from keyboards import start_keyboards as kbmod
from services.payloads import OrderPayload, VendorStatusPayload
from tests.conftest import MessageFactory, make_user
from utils import messages as msg
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


def make_order(display_id: str | int = "123") -> OrderPayload:
    return OrderPayload(
        id="order-1",
        display_id=display_id,
        restaurant_name="Cafe",
        status="PENDING",
        total_price=50000,
    )


def test_orders_keyboard_none_without_url(without_mini_app: None) -> None:
    assert kbmod.orders_keyboard([make_order()]) is None


def test_orders_keyboard_with_url(with_mini_app: None) -> None:
    kb = kbmod.orders_keyboard([make_order()])
    assert isinstance(kb, InlineKeyboardMarkup)
    assert kbmod.orders_keyboard([]) is None
    assert kbmod.orders_keyboard([make_order(display_id="")]) is None


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
    message_factory: MessageFactory,
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


def test_display_name_without_user(message_factory: MessageFactory) -> None:
    message = message_factory(from_user=None)
    assert _display_name(message) == "Telegram User"


def make_vendor_status(
    is_vendor: bool = True,
    approval_status: str | None = None,
    rejection_reason: str | None = None,
) -> VendorStatusPayload:
    return VendorStatusPayload(
        is_vendor=is_vendor,
        approval_status=approval_status,
        rejection_reason=rejection_reason,
    )


def test_vendor_status_text() -> None:
    assert vendor_status_text(make_vendor_status(is_vendor=False)) == msg.text("vendorNotFound")
    assert vendor_status_text(make_vendor_status(approval_status="APPROVED")) == msg.text(
        "vendorApproved"
    )
    assert vendor_status_text(make_vendor_status(approval_status="REJECTED")) == msg.text(
        "vendorRejected", suffix=""
    )
    assert msg.text("vendorRejectionReason", reason="test") in vendor_status_text(
        make_vendor_status(approval_status="REJECTED", rejection_reason="test")
    )
    assert vendor_status_text(make_vendor_status(approval_status="PENDING")) == msg.text(
        "vendorPending"
    )
