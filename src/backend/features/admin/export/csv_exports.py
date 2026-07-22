import asyncio
import csv
import io
from collections.abc import Callable, Iterable
from datetime import UTC, date, datetime, timedelta
from typing import Any, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.crud import translate_status
from shared.enums.order_status import OrderStatus
from shared.i18n import DEFAULT_LANGUAGE, translate

MAX_EXPORT_DAYS = 31

_T = TypeVar("_T")


def _make_csv(headers: list[str], rows: list[list[Any]]) -> bytes:
    return _render_csv(headers, rows, lambda row: row)


def _render_csv(
    headers: list[str], items: Iterable[_T], row_builder: Callable[[_T], list[Any]]
) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(row_builder(item) for item in items)
    return buf.getvalue().encode("utf-8-sig")


async def _make_csv_async(
    headers: list[str], items: Iterable[_T], row_builder: Callable[[_T], list[Any]]
) -> bytes:
    return await asyncio.to_thread(_render_csv, headers, items, row_builder)


def _boolean_label(value: bool, language: str) -> str:
    return translate("reports.common.yes" if value else "reports.common.no", language)


async def export_users_csv(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    if date_from is None:
        date_to = date_to or datetime.now(UTC).date()
        date_from = date_to - timedelta(days=MAX_EXPORT_DAYS - 1)
    if date_to is None:
        date_to = date_from + timedelta(days=MAX_EXPORT_DAYS - 1)
    if (date_to - date_from).days > MAX_EXPORT_DAYS:
        date_from = date_to - timedelta(days=MAX_EXPORT_DAYS - 1)
    users = await crud.get_all_users(
        session,
        date_from=date_from,
        date_to=date_to,
        offset=0,
        limit=10_000,
    )
    headers = [
        translate("reports.csv.users.id", language),
        translate("reports.csv.users.name", language),
        translate("reports.csv.users.phone", language),
        translate("reports.csv.users.email", language),
        translate("reports.csv.users.telegram", language),
        translate("reports.csv.users.permissions", language),
        translate("reports.csv.users.isActive", language),
        translate("reports.csv.users.createdAt", language),
    ]
    return await _make_csv_async(
        headers,
        users,
        lambda u: [
            str(u.id),
            u.name or "",
            u.phone_number,
            u.email or "",
            u.telegram_username or "",
            ",".join(str(p) for p in (u.permissions or [])),
            _boolean_label(bool(u.is_active), language),
            u.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )


async def export_orders_csv(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    status: OrderStatus | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    orders = await crud.get_all_orders(
        session, status=status, date_from=date_from, date_to=date_to, offset=0, limit=50_000
    )
    headers = [
        translate("reports.csv.orders.id", language),
        translate("reports.csv.orders.number", language),
        translate("reports.csv.orders.customer", language),
        translate("reports.csv.orders.customerPhone", language),
        translate("reports.csv.orders.restaurant", language),
        translate("reports.csv.orders.status", language),
        translate("reports.csv.orders.total", language),
        translate("reports.csv.orders.cancellationReason", language),
        translate("reports.csv.orders.createdAt", language),
    ]
    return await _make_csv_async(
        headers,
        orders,
        lambda o: [
            str(o.id),
            getattr(o, "display_id", None) or str(o.id)[:8],
            o.user.name if o.user else "",
            o.user.phone_number if o.user else "",
            o.restaurant.name if o.restaurant else "",
            translate_status(o.status, language),
            o.total_price,
            getattr(o, "cancellation_reason", "") or "",
            o.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )


async def export_restaurants_csv(
    session: AsyncSession, language: str = DEFAULT_LANGUAGE
) -> bytes:
    restaurants = await crud.get_all_restaurants(session, offset=0, limit=50_000)
    headers = [
        translate("reports.csv.restaurants.id", language),
        translate("reports.csv.restaurants.name", language),
        translate("reports.csv.restaurants.address", language),
        translate("reports.csv.restaurants.vendor", language),
        translate("reports.csv.restaurants.vendorPhone", language),
        translate("reports.csv.restaurants.moderationStatus", language),
        translate("reports.csv.restaurants.rating", language),
        translate("reports.csv.restaurants.reviews", language),
        translate("reports.csv.restaurants.orders", language),
        translate("reports.csv.restaurants.createdAt", language),
    ]
    return await _make_csv_async(
        headers,
        restaurants,
        lambda r: [
            str(r.id),
            r.name,
            r.address,
            r.vendor_name or "",
            r.vendor_phone or "",
            r.moderation_status,
            r.average_rating,
            r.review_count,
            r.orders_count,
            r.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )


async def export_vendors_csv(session: AsyncSession, language: str = DEFAULT_LANGUAGE) -> bytes:
    vendors = await crud.get_all_vendors(session, offset=0, limit=50_000)
    headers = [
        translate("reports.csv.vendors.id", language),
        translate("reports.csv.vendors.name", language),
        translate("reports.csv.vendors.phone", language),
        translate("reports.csv.vendors.status", language),
        translate("reports.csv.vendors.restaurants", language),
        translate("reports.csv.vendors.createdAt", language),
    ]
    return await _make_csv_async(
        headers,
        vendors,
        lambda v: [
            str(v.id),
            v.user.name if v.user else "",
            v.user.phone_number if v.user else "",
            v.approval_status,
            len(v.restaurants or []),
            v.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )


async def export_reviews_csv(
    session: AsyncSession,
    min_rating: int | None = None,
    max_rating: int | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    reviews = await crud.get_all_reviews(session, offset=0, limit=50_000)
    if min_rating is not None:
        reviews = [r for r in reviews if r.rating >= min_rating]
    if max_rating is not None:
        reviews = [r for r in reviews if r.rating <= max_rating]
    headers = [
        translate("reports.csv.reviews.id", language),
        translate("reports.csv.reviews.restaurant", language),
        translate("reports.csv.reviews.author", language),
        translate("reports.csv.reviews.rating", language),
        translate("reports.csv.reviews.text", language),
        translate("reports.csv.reviews.verifiedPurchase", language),
        translate("reports.csv.reviews.createdAt", language),
    ]
    return await _make_csv_async(
        headers,
        reviews,
        lambda r: [
            str(r.id),
            r.restaurant_name or "",
            r.user_name or "",
            r.rating,
            r.text or "",
            _boolean_label(bool(r.is_verified_purchase), language),
            r.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )
