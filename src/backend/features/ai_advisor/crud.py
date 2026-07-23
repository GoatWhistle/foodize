import uuid
from datetime import UTC, date, datetime

from sqlalchemy import Case, ColumnElement, Select, and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.ai_advisor.schemas_tools import (
    BottomItemRow,
    MenuOverviewRow,
    RecentReview,
    ReviewsSummary,
)
from features.menu.models import MenuItem
from features.orders.models import Order, OrderItem
from features.restaurants.models import Restaurant
from features.reviews.models import Review
from shared.enums.order_status import OrderStatus

_REVIEW_TEXT_MAX_CHARS = 500


def _sanitize_review_text(text: str | None) -> str:
    if not text:
        return ""
    trimmed = text[:_REVIEW_TEXT_MAX_CHARS]
    return f"<<<REVIEW>>>{trimmed}<<<END_REVIEW>>>"


def day_bounds(start_date: date, end_date: date) -> tuple[datetime, datetime]:
    start = datetime.combine(start_date, datetime.min.time(), tzinfo=UTC)
    end = datetime.combine(end_date, datetime.max.time(), tzinfo=UTC)
    return start, end


def _sold_quantity_case(start: datetime, end: datetime) -> Case[int]:
    return case(
        (
            and_(
                Order.id.isnot(None),
                Order.status == OrderStatus.COMPLETED.value,
                Order.created_at >= start,
                Order.created_at <= end,
            ),
            OrderItem.quantity,
        ),
        else_=0,
    )


def _bottom_items_stmt(
    vendor_id: uuid.UUID,
    start: datetime,
    end: datetime,
    restaurant_id: uuid.UUID | None,
    limit: int,
) -> Select[tuple[str, str, int, bool, int]]:
    sold = _sold_quantity_case(start, end)
    filters = [Restaurant.vendor_id == vendor_id, MenuItem.is_deleted.is_(False)]
    if restaurant_id is not None:
        filters.append(MenuItem.restaurant_id == restaurant_id)
    return (
        select(
            MenuItem.name,
            MenuItem.category,
            MenuItem.price,
            MenuItem.is_available,
            func.coalesce(func.sum(sold), 0).label("sold_qty"),
        )
        .select_from(MenuItem)
        .join(Restaurant, Restaurant.id == MenuItem.restaurant_id)
        .outerjoin(OrderItem, OrderItem.menu_item_id == MenuItem.id)
        .outerjoin(Order, Order.id == OrderItem.order_id)
        .where(*filters)
        .group_by(
            MenuItem.id,
            MenuItem.name,
            MenuItem.category,
            MenuItem.price,
            MenuItem.is_available,
        )
        .order_by(func.coalesce(func.sum(sold), 0).asc(), MenuItem.name.asc())
        .limit(limit)
    )


async def get_bottom_items(
    session: AsyncSession,
    *,
    vendor_id: uuid.UUID,
    start_date: date,
    end_date: date,
    restaurant_id: uuid.UUID | None = None,
    limit: int = 10,
) -> list[BottomItemRow]:
    start, end = day_bounds(start_date, end_date)
    rows = await session.execute(_bottom_items_stmt(vendor_id, start, end, restaurant_id, limit))
    return [
        BottomItemRow(
            name=name,
            category=category,
            price=price,
            is_available=is_available,
            sold_qty=int(sold_qty or 0),
        )
        for name, category, price, is_available, sold_qty in rows.all()
    ]


async def get_menu_overview(
    session: AsyncSession,
    *,
    vendor_id: uuid.UUID,
    restaurant_id: uuid.UUID | None = None,
    limit: int = 100,
) -> list[MenuOverviewRow]:
    filters = [Restaurant.vendor_id == vendor_id, MenuItem.is_deleted.is_(False)]
    if restaurant_id is not None:
        filters.append(MenuItem.restaurant_id == restaurant_id)

    stmt = (
        select(
            Restaurant.name,
            MenuItem.name,
            MenuItem.category,
            MenuItem.price,
            MenuItem.is_available,
        )
        .join(Restaurant, Restaurant.id == MenuItem.restaurant_id)
        .where(*filters)
        .order_by(Restaurant.name.asc(), MenuItem.category.asc(), MenuItem.name.asc())
        .limit(limit)
    )
    rows = await session.execute(stmt)
    return [
        MenuOverviewRow(
            restaurant=restaurant,
            name=item_name,
            category=category,
            price=price,
            is_available=is_available,
        )
        for restaurant, item_name, category, price, is_available in rows.all()
    ]


async def _recent_reviews(
    session: AsyncSession, filters: list[ColumnElement[bool]], recent_limit: int
) -> list[RecentReview]:
    recent_rows = await session.execute(
        select(Review.rating, Review.text)
        .join(Restaurant, Restaurant.id == Review.restaurant_id)
        .where(*filters, Review.text.isnot(None))
        .order_by(Review.created_at.desc())
        .limit(recent_limit)
    )
    return [
        RecentReview(rating=int(rating), text=_sanitize_review_text(text))
        for rating, text in recent_rows.all()
    ]


async def get_reviews_summary(
    session: AsyncSession,
    *,
    vendor_id: uuid.UUID,
    restaurant_id: uuid.UUID | None = None,
    recent_limit: int = 5,
) -> ReviewsSummary:
    filters = [Restaurant.vendor_id == vendor_id, Review.deleted_at.is_(None)]
    if restaurant_id is not None:
        filters.append(Review.restaurant_id == restaurant_id)

    totals = await session.execute(
        select(func.coalesce(func.avg(Review.rating), 0), func.count(Review.id))
        .join(Restaurant, Restaurant.id == Review.restaurant_id)
        .where(*filters)
    )
    avg_rating, review_count = totals.one()

    dist_rows = await session.execute(
        select(Review.rating, func.count(Review.id))
        .join(Restaurant, Restaurant.id == Review.restaurant_id)
        .where(*filters)
        .group_by(Review.rating)
    )
    distribution = {int(rating): int(count) for rating, count in dist_rows.all()}

    recent = await _recent_reviews(session, filters, recent_limit)

    return ReviewsSummary(
        average_rating=round(float(avg_rating or 0), 2),
        review_count=int(review_count or 0),
        distribution=distribution,
        recent=recent,
    )
