import uuid
from datetime import UTC, date, datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud as admin_crud
from features.admin.crud import translate_category, translate_status
from features.admin.export import _build_analytics_pdf, _build_finance_pdf, _make_csv
from features.menu.crud import get_menu_items
from features.promos.crud import get_promos_by_restaurant_ids
from features.vendors.models import VendorProfile
from shared.dependencies import get_vendor_restaurant_ids
from shared.enums.order_status import OrderStatus
from shared.i18n import DEFAULT_LANGUAGE, translate

if TYPE_CHECKING:
    from features.menu.models import MenuItem
    from features.orders.models import Order

_EXPORT_ROW_LIMIT = 10_000
_DEFAULT_ORDERS_PERIOD_DAYS = 90
_DATETIME_FORMAT = "%Y-%m-%d %H:%M"


def _order_headers(language: str) -> list[str]:
    return [
        translate("reports.csv.orders.id", language),
        translate("reports.csv.orders.number", language),
        translate("reports.csv.orders.customer", language),
        translate("reports.csv.orders.restaurant", language),
        translate("reports.csv.orders.status", language),
        translate("reports.csv.orders.itemsCount", language),
        translate("reports.csv.orders.total", language),
        translate("reports.csv.orders.createdAt", language),
    ]


def _boolean_label(value: bool, language: str) -> str:
    return translate("reports.common.yes" if value else "reports.common.no", language)


def _owned_restaurant_ids(
    vendor: VendorProfile, restaurant_id: uuid.UUID | None
) -> list[uuid.UUID]:
    vendor_restaurant_ids = get_vendor_restaurant_ids(vendor)
    if restaurant_id and restaurant_id in vendor_restaurant_ids:
        return [restaurant_id]
    return list(vendor_restaurant_ids)


def _order_row(order: "Order", language: str) -> list[object]:
    return [
        str(order.id),
        getattr(order, "display_id", None) or str(order.id)[:8],
        order.user.name if order.user else "",
        order.restaurant.name if order.restaurant else "",
        translate_status(order.status, language),
        len(order.items or []),
        order.total_price,
        order.created_at.strftime(_DATETIME_FORMAT),
    ]


async def export_orders_csv(
    session: AsyncSession,
    vendor: VendorProfile,
    date_from: date | None = None,
    date_to: date | None = None,
    status: OrderStatus | None = None,
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    headers = _order_headers(language)
    vendor_restaurant_ids = get_vendor_restaurant_ids(vendor)
    if restaurant_id and restaurant_id not in vendor_restaurant_ids:
        return _make_csv(headers, [])
    query_restaurant_id = restaurant_id or None

    if date_from is None and date_to is None:
        date_to = datetime.now(UTC).date()
        date_from = date_to - timedelta(days=_DEFAULT_ORDERS_PERIOD_DAYS)

    orders = await admin_crud.get_all_orders(
        session,
        status=status,
        date_from=date_from,
        date_to=date_to,
        restaurant_id=query_restaurant_id,
        offset=0,
        limit=_EXPORT_ROW_LIMIT,
    )
    if query_restaurant_id is None:
        orders = [order for order in orders if order.restaurant_id in vendor_restaurant_ids]
    return _make_csv(headers, [_order_row(order, language) for order in orders])


async def export_menu_csv(
    session: AsyncSession,
    vendor: VendorProfile,
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    restaurant_ids = _owned_restaurant_ids(vendor, restaurant_id)

    all_items: list[MenuItem] = []
    for owned_restaurant_id in restaurant_ids:
        items = await get_menu_items(session, owned_restaurant_id, limit=_EXPORT_ROW_LIMIT)
        all_items.extend(items)

    headers = [
        translate("reports.csv.menu.id", language),
        translate("reports.csv.menu.name", language),
        translate("reports.csv.menu.category", language),
        translate("reports.csv.menu.price", language),
        translate("reports.csv.menu.isAvailable", language),
        translate("reports.csv.menu.restaurantId", language),
    ]
    rows = [
        [
            str(item.id),
            item.name,
            translate_category(item.category, language),
            item.price,
            _boolean_label(bool(item.is_available), language),
            str(item.restaurant_id),
        ]
        for item in all_items
        if not item.is_deleted
    ]
    return _make_csv(headers, rows)


async def export_promos_csv(
    session: AsyncSession,
    vendor: VendorProfile,
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    target_ids = _owned_restaurant_ids(vendor, restaurant_id)

    promos = await get_promos_by_restaurant_ids(
        session, target_ids, offset=0, limit=_EXPORT_ROW_LIMIT
    )

    headers = [
        translate("reports.csv.promos.code", language),
        translate("reports.csv.promos.discountType", language),
        translate("reports.csv.promos.discountValue", language),
        translate("reports.csv.promos.maxUses", language),
        translate("reports.csv.promos.usedCount", language),
        translate("reports.csv.promos.isActive", language),
        translate("reports.csv.promos.createdAt", language),
    ]
    unlimited = translate("reports.common.infinity", language)
    rows = [
        [
            p.code,
            p.discount_type,
            p.discount_value,
            p.max_uses if p.max_uses is not None else unlimited,
            p.used_count,
            _boolean_label(bool(p.is_active), language),
            p.created_at.strftime(_DATETIME_FORMAT),
        ]
        for p in promos
    ]
    return _make_csv(headers, rows)


async def export_finance_pdf(
    session: AsyncSession,
    vendor: VendorProfile,
    date_from: date | None = None,
    date_to: date | None = None,
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    analytics = await admin_crud.get_finance_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor.id,
        restaurant_id=restaurant_id,
    )
    return _build_finance_pdf(
        translate("reports.finance.vendorTitle", language),
        analytics,
        date_from,
        date_to,
        language,
    )


async def export_analytics_pdf(
    session: AsyncSession,
    vendor: VendorProfile,
    date_from: date | None = None,
    date_to: date | None = None,
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    analytics = await admin_crud.get_advanced_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor.id,
        restaurant_id=restaurant_id,
        language=language,
    )
    return _build_analytics_pdf(
        translate("reports.analytics.vendorTitle", language),
        analytics,
        date_from,
        date_to,
        language,
    )
