import html
from typing import Any

from i18n import DEFAULT_LANGUAGE
from utils import messages as msg


def format_price(cents: int) -> str:
    return f"{cents // 100},{cents % 100:02d} ₽"


def format_status(status: str, language: str = DEFAULT_LANGUAGE) -> str:
    return msg.order_status(status, language)


def format_order_line(order: dict[str, Any], language: str = DEFAULT_LANGUAGE) -> str:
    restaurant = html.escape(order.get("restaurant_name") or msg.fallback("restaurant", language))
    display_id = html.escape(str(order.get("display_id", "")))
    return (
        f"• #{display_id} — {restaurant}, "
        f"{html.escape(format_status(order.get('status', ''), language))}, "
        f"{format_price(order.get('total_price', 0))}"
    )


def vendor_status_text(vendor_status: dict[str, Any], language: str = DEFAULT_LANGUAGE) -> str:
    if not vendor_status.get("is_vendor"):
        return msg.text("vendorNotFound", language)
    status = vendor_status.get("approval_status")
    if status == "APPROVED":
        return msg.text("vendorApproved", language)
    if status == "REJECTED":
        reason = vendor_status.get("rejection_reason")
        suffix = (
            msg.text("vendorRejectionReason", language, reason=html.escape(reason))
            if reason
            else ""
        )
        return msg.text("vendorRejected", language, suffix=suffix)
    return msg.text("vendorPending", language)
