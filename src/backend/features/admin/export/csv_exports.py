import asyncio
import csv
import io
from collections.abc import Callable, Iterable
from datetime import UTC, date, datetime, timedelta
from typing import Any, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.crud import STATUS_RU
from shared.enums.order_status import OrderStatus

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


async def export_users_csv(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
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
    headers = ["ID", "Имя", "Телефон", "Email", "Telegram", "Права", "Активен", "Дата регистрации"]
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
            "Да" if u.is_active else "Нет",
            u.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )


async def export_orders_csv(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    status: OrderStatus | None = None,
) -> bytes:
    orders = await crud.get_all_orders(
        session, status=status, date_from=date_from, date_to=date_to, offset=0, limit=50_000
    )
    headers = [
        "ID",
        "Номер",
        "Клиент",
        "Телефон клиента",
        "Ресторан",
        "Статус",
        "Сумма (₽)",
        "Причина отмены",
        "Дата создания",
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
            STATUS_RU.get(o.status, o.status),
            o.total_price,
            getattr(o, "cancellation_reason", "") or "",
            o.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )


async def export_restaurants_csv(session: AsyncSession) -> bytes:
    restaurants = await crud.get_all_restaurants(session, offset=0, limit=50_000)
    headers = [
        "ID",
        "Название",
        "Адрес",
        "Вендор",
        "Телефон вендора",
        "Статус модерации",
        "Рейтинг",
        "Отзывов",
        "Заказов",
        "Дата создания",
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


async def export_vendors_csv(session: AsyncSession) -> bytes:
    vendors = await crud.get_all_vendors(session, offset=0, limit=50_000)
    headers = ["ID", "Имя", "Телефон", "Статус", "Ресторанов", "Дата заявки"]
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
) -> bytes:
    reviews = await crud.get_all_reviews(session, offset=0, limit=50_000)
    if min_rating is not None:
        reviews = [r for r in reviews if r.rating >= min_rating]
    if max_rating is not None:
        reviews = [r for r in reviews if r.rating <= max_rating]
    headers = ["ID", "Ресторан", "Автор", "Рейтинг", "Текст", "Подтв. покупка", "Дата"]
    return await _make_csv_async(
        headers,
        reviews,
        lambda r: [
            str(r.id),
            r.restaurant_name or "",
            r.user_name or "",
            r.rating,
            r.text or "",
            "Да" if r.is_verified_purchase else "Нет",
            r.created_at.strftime("%Y-%m-%d %H:%M"),
        ],
    )
