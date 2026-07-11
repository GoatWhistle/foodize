import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.crud.analytics_shared import finance_points, parse_day
from features.admin.schemas import (
    FinanceAnalytics,
    FinanceTopItem,
    FinanceTopRestaurant,
)
from features.menu.models import MenuItem
from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from shared.enums.order_status import OrderStatus


def _build_order_filters(
    start_date: date,
    end_date: date,
    vendor_id: uuid.UUID | None,
    restaurant_id: uuid.UUID | None,
) -> list:
    filters = [
        Order.created_at >= datetime.combine(start_date, datetime.min.time(), tzinfo=UTC),
        Order.created_at
        < datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=UTC),
    ]
    if vendor_id is not None:
        filters.append(Restaurant.vendor_id == vendor_id)
    if restaurant_id is not None:
        filters.append(Order.restaurant_id == restaurant_id)
    return filters


async def _fetch_revenue_by_day(session: AsyncSession, order_filters: list) -> dict[date, int]:
    rows = await session.execute(
        select(func.date(Order.created_at), func.coalesce(func.sum(Order.total_price), 0))
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*order_filters, Order.status == OrderStatus.COMPLETED.value)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )
    counts: dict[date, int] = {}
    for day, value in rows.all():
        counts[parse_day(day)] = int(value or 0)
    return counts


async def _fetch_order_totals(session: AsyncSession, order_filters: list) -> tuple:
    result = await session.execute(
        select(
            func.count(Order.id),
            func.count().filter(Order.status == OrderStatus.COMPLETED.value),
            func.count().filter(Order.status == OrderStatus.CANCELLED.value),
            func.coalesce(
                func.avg(Order.total_price).filter(Order.status == OrderStatus.COMPLETED.value),
                0,
            ),
        )
        .select_from(Order)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*order_filters)
    )
    return result.one()


async def _fetch_top_restaurants(session: AsyncSession, order_filters: list) -> list:
    rows = await session.execute(
        select(
            Restaurant.id,
            Restaurant.name,
            func.coalesce(func.sum(Order.total_price), 0).label("revenue"),
            func.count(Order.id).label("orders_count"),
        )
        .join(Order, Order.restaurant_id == Restaurant.id)
        .where(*order_filters, Order.status == OrderStatus.COMPLETED.value)
        .group_by(Restaurant.id, Restaurant.name)
        .order_by(func.coalesce(func.sum(Order.total_price), 0).desc())
        .limit(5)
    )
    return [
        FinanceTopRestaurant(
            restaurant_id=row[0],
            name=row[1],
            revenue=int(row[2] or 0),
            orders_count=row[3],
        )
        for row in rows.all()
    ]


async def _fetch_top_items(session: AsyncSession, order_filters: list) -> list:
    rows = await session.execute(
        select(
            MenuItem.id,
            MenuItem.name,
            func.coalesce(func.sum(OrderItem.quantity), 0).label("quantity"),
            func.coalesce(func.sum(OrderItem.quantity * OrderItem.price_at_purchase), 0).label(
                "revenue"
            ),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*order_filters, Order.status == OrderStatus.COMPLETED.value)
        .group_by(MenuItem.id, MenuItem.name)
        .order_by(func.coalesce(func.sum(OrderItem.quantity), 0).desc())
        .limit(5)
    )
    return [
        FinanceTopItem(
            menu_item_id=row[0],
            name=row[1],
            quantity=int(row[2] or 0),
            revenue=int(row[3] or 0),
        )
        for row in rows.all()
    ]


async def _fetch_prev_revenue(
    session: AsyncSession,
    prev_start: date,
    prev_end: date,
    vendor_id: uuid.UUID | None,
    restaurant_id: uuid.UUID | None,
) -> int:
    prev_filters = _build_order_filters(prev_start, prev_end, vendor_id, restaurant_id)
    prev_filters.append(Order.status == OrderStatus.COMPLETED.value)
    row = await session.execute(
        select(func.coalesce(func.sum(Order.total_price), 0))
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*prev_filters)
    )
    return int(row.scalar_one())


async def get_finance_analytics(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    vendor_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
) -> FinanceAnalytics:
    end_date = date_to or datetime.now(UTC).date()
    start_date = date_from or (end_date - timedelta(days=13))
    days = (end_date - start_date).days + 1

    order_filters = _build_order_filters(start_date, end_date, vendor_id, restaurant_id)

    revenue_counts = await _fetch_revenue_by_day(session, order_filters)
    total_orders, completed_orders, cancelled_orders, average_check = await _fetch_order_totals(
        session, order_filters
    )
    top_restaurants = await _fetch_top_restaurants(session, order_filters)
    top_items = await _fetch_top_items(session, order_filters)

    total_revenue = sum(revenue_counts.values())
    conversion = round((completed_orders / total_orders) * 100, 1) if total_orders else 0.0

    prev_end = start_date - timedelta(days=1)
    prev_start = prev_end - timedelta(days=days - 1)
    prev_revenue = await _fetch_prev_revenue(
        session, prev_start, prev_end, vendor_id, restaurant_id
    )

    if prev_revenue > 0:
        revenue_growth_pct: float | None = round(
            (total_revenue - prev_revenue) / prev_revenue * 100, 1
        )
    elif total_revenue > 0:
        revenue_growth_pct = 100.0
    else:
        revenue_growth_pct = None

    return FinanceAnalytics(
        revenue_by_day=finance_points(revenue_counts, start_date, days),
        average_check=round(float(average_check or 0), 1),
        top_restaurants=top_restaurants,
        top_items=top_items,
        cancelled_orders=cancelled_orders,
        total_orders=total_orders,
        completed_orders=completed_orders,
        conversion_percent=conversion,
        total_revenue=total_revenue,
        revenue_growth_pct=revenue_growth_pct,
    )
