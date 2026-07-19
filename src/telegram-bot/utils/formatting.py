import html
from typing import Any

from utils import messages as msg

_STATUS_LABELS: dict[str, str] = {
    "PENDING": "Ожидает подтверждения",
    "ACCEPTED": "Принят рестораном",
    "COOKING": "Готовится",
    "READY": "Готов к выдаче",
    "COMPLETED": "Выполнен",
    "CANCELLED": "Отменён",
}


def format_price(cents: int) -> str:
    return f"{cents // 100},{cents % 100:02d} ₽"


def format_status(status: str) -> str:
    return _STATUS_LABELS.get(status, status)


def format_order_line(order: dict[str, Any]) -> str:
    restaurant = html.escape(order.get("restaurant_name") or "ресторан")
    display_id = html.escape(str(order.get("display_id", "")))
    return (
        f"• #{display_id} — {restaurant}, "
        f"{html.escape(format_status(order.get('status', '')))}, "
        f"{format_price(order.get('total_price', 0))}"
    )


def vendor_status_text(vendor_status: dict[str, Any]) -> str:
    if not vendor_status.get("is_vendor"):
        return msg.VENDOR_NOT_FOUND
    status = vendor_status.get("approval_status")
    if status == "APPROVED":
        return msg.VENDOR_APPROVED
    if status == "REJECTED":
        reason = vendor_status.get("rejection_reason")
        suffix = f"\n\nПричина: {html.escape(reason)}" if reason else ""
        return msg.VENDOR_REJECTED.format(suffix=suffix)
    return msg.VENDOR_PENDING
