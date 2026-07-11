import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.crud.analytics_shared import CATEGORY_RU, finance_points, parse_day
from features.admin.schemas import AdvancedAnalytics, AnalyticsPoint
from features.menu.models import MenuItem
from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from shared.enums.order_status import OrderStatus


async def get_advanced_analytics(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    restaurant_id: uuid.UUID | None = None,
    vendor_id: uuid.UUID | None = None,
) -> AdvancedAnalytics:
    end_date = date_to or datetime.now(UTC).date()
    start_date = date_from or (end_date - timedelta(days=29))

    filters = [
        Order.created_at >= datetime.combine(start_date, datetime.min.time(), tzinfo=UTC),
        Order.created_at
        < datetime.combine(end_date + timedelta(days=1), datetime.min.time(), tzinfo=UTC),
        Order.status == OrderStatus.COMPLETED.value,
    ]
    if restaurant_id:
        filters.append(Order.restaurant_id == restaurant_id)
    if vendor_id:
        filters.append(Restaurant.vendor_id == vendor_id)

    hourly_rows = await session.execute(
        select(func.extract("hour", Order.created_at).label("hour"), func.count(Order.id))
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*filters)
        .group_by("hour")
        .order_by("hour")
    )
    hourly_load = [
        AnalyticsPoint(label=f"{int(row[0]):02d}:00", value=row[1]) for row in hourly_rows.all()
    ]

    category_rows = await session.execute(
        select(
            MenuItem.category,
            func.sum(OrderItem.quantity * OrderItem.price_at_purchase),
        )
        .join(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .join(Order, Order.id == OrderItem.order_id)
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*filters)
        .group_by(MenuItem.category)
    )
    category_revenue = [
        AnalyticsPoint(
            label=CATEGORY_RU.get(row[0], row[0] or "Без категории"), value=int(row[1] or 0)
        )
        for row in category_rows.all()
    ]

    aov_rows = await session.execute(
        select(func.date(Order.created_at), func.avg(Order.total_price))
        .join(Restaurant, Restaurant.id == Order.restaurant_id)
        .where(*filters)
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at))
    )

    aov_counts = {parse_day(row[0]): int(row[1] or 0) for row in aov_rows.all()}
    days_count = (end_date - start_date).days + 1
    aov_dynamics = finance_points(aov_counts, start_date, days_count)

    return AdvancedAnalytics(
        hourly_load=hourly_load,
        category_revenue=category_revenue,
        aov_dynamics=aov_dynamics,
    )
