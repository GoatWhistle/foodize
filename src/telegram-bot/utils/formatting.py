import html

from i18n import DEFAULT_LANGUAGE
from services.payloads import OrderPayload, VendorStatusPayload
from utils import messages as msg


def format_price(cents: int) -> str:
    return f"{cents // 100},{cents % 100:02d} ₽"


def format_status(status: str, language: str = DEFAULT_LANGUAGE) -> str:
    return msg.order_status(status, language)


def format_order_line(order: OrderPayload, language: str = DEFAULT_LANGUAGE) -> str:
    restaurant = html.escape(order["restaurant_name"] or msg.fallback("restaurant", language))
    display_id = html.escape(str(order["display_id"]))
    return (
        f"• #{display_id} — {restaurant}, "
        f"{html.escape(format_status(order['status'], language))}, "
        f"{format_price(order['total_price'])}"
    )


def vendor_status_text(vendor_status: VendorStatusPayload, language: str = DEFAULT_LANGUAGE) -> str:
    if not vendor_status["is_vendor"]:
        return msg.text("vendorNotFound", language)
    status = vendor_status["approval_status"]
    if status == "APPROVED":
        return msg.text("vendorApproved", language)
    if status == "REJECTED":
        reason = vendor_status["rejection_reason"]
        suffix = (
            msg.text("vendorRejectionReason", language, reason=html.escape(reason))
            if reason
            else ""
        )
        return msg.text("vendorRejected", language, suffix=suffix)
    return msg.text("vendorPending", language)
