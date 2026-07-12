import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from sqlalchemy import ColumnElement, Select, Subquery, asc, desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from features.orders.models.order import Order
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate
from features.restaurants.working_hours import WorkingHours
from shared.enums.moderation_status import ModerationStatus
from shared.enums.restaurant_sort import RestaurantSort
from shared.enums.sort_direction import SortDirection
from shared.exceptions.existence import AlreadyExistsException

_DISPLAY_ID_GENERATION_ATTEMPTS = 8
_POPULARITY_WINDOW_DAYS = 7


async def _generate_unique_display_id(session: AsyncSession) -> str:
    for _ in range(_DISPLAY_ID_GENERATION_ATTEMPTS):
        display_id = secrets.token_hex(4)
        if await get_restaurant_by_display_id(session, display_id) is None:
            return display_id
    raise AlreadyExistsException(detail="Could not generate unique restaurant display id")


async def create_restaurant(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: uuid.UUID
) -> Restaurant:
    display_id = await _generate_unique_display_id(session)
    new_restaurant = Restaurant(
        **restaurant_data.model_dump(), vendor_id=vendor_id, display_id=display_id
    )
    session.add(new_restaurant)
    try:
        await session.flush()
    except IntegrityError as e:
        await session.rollback()
        raise AlreadyExistsException(
            detail="Restaurant with this address or display id already exists"
        ) from e
    return new_restaurant


async def update_restaurant(
    session: AsyncSession, restaurant: Restaurant, update_data: RestaurantUpdate
) -> Restaurant:
    for key, value in update_data.model_dump(exclude_unset=True).items():
        setattr(restaurant, key, value)
    try:
        await session.flush()
    except IntegrityError as e:
        await session.rollback()
        raise AlreadyExistsException(detail="Restaurant with this address already exists") from e
    await session.refresh(restaurant)
    return restaurant


async def get_vendor_restaurants(
    session: AsyncSession,
    vendor_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
) -> list[Restaurant]:
    result = await session.execute(
        select(Restaurant)
        .where(Restaurant.vendor_id == vendor_id, Restaurant.deleted_at.is_(None))
        .order_by(Restaurant.id)
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_vendor_restaurants(session: AsyncSession, vendor_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(Restaurant)
        .where(Restaurant.vendor_id == vendor_id, Restaurant.deleted_at.is_(None))
    )
    return result.scalar_one()


async def get_restaurant_by_id(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> Restaurant | None:
    stmt = select(Restaurant).where(Restaurant.id == restaurant_id, Restaurant.deleted_at.is_(None))
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def get_restaurant_by_display_id(session: AsyncSession, display_id: str) -> Restaurant | None:
    stmt = select(Restaurant).where(
        Restaurant.display_id == display_id, Restaurant.deleted_at.is_(None)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


async def count_restaurants(
    session: AsyncSession,
    name: str | None = None,
    is_hiring: bool | None = None,
    is_open: bool | None = None,
) -> int:
    stmt = select(func.count()).select_from(Restaurant).where(Restaurant.deleted_at.is_(None))
    if name is not None:
        stmt = stmt.where(Restaurant.name.ilike(f"%{name}%"))
    if is_hiring is not None:
        stmt = stmt.where(Restaurant.is_hiring == is_hiring)
    if is_open is not None:
        stmt = stmt.where(Restaurant.is_open == is_open)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_all_restaurants(
    session: AsyncSession,
    name: str | None = None,
    is_hiring: bool | None = None,
    is_open: bool | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[Restaurant]:
    stmt = select(Restaurant).where(Restaurant.deleted_at.is_(None))
    if name is not None:
        stmt = stmt.where(Restaurant.name.ilike(f"%{name}%"))
    if is_hiring is not None:
        stmt = stmt.where(Restaurant.is_hiring == is_hiring)
    if is_open is not None:
        stmt = stmt.where(Restaurant.is_open == is_open)
    stmt = stmt.order_by(Restaurant.name).offset(offset).limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


def _popularity_subquery() -> Subquery:
    since = datetime.now(UTC) - timedelta(days=_POPULARITY_WINDOW_DAYS)
    return (
        select(Order.restaurant_id, func.count(Order.id).label("orders_count_7d"))
        .where(Order.created_at >= since)
        .group_by(Order.restaurant_id)
        .subquery()
    )


def _apply_public_filters(
    stmt: Select[Any],
    name: str | None,
    is_hiring: bool | None,
    is_open: bool | None,
) -> Select[Any]:
    stmt = stmt.where(Restaurant.is_active.is_(True), Restaurant.deleted_at.is_(None))
    if name:
        stmt = stmt.where(Restaurant.name.ilike(f"%{name}%"))
    if is_hiring is not None:
        stmt = stmt.where(Restaurant.is_hiring == is_hiring)
    if is_open is not None:
        stmt = stmt.where(Restaurant.is_open == is_open)
    return stmt.where(Restaurant.moderation_status == ModerationStatus.APPROVED.value)


async def get_public_restaurant_with_popularity(
    session: AsyncSession, where_clause: ColumnElement[bool]
) -> tuple[Restaurant, int] | None:
    popularity = _popularity_subquery()
    stmt = _apply_public_filters(
        select(
            Restaurant,
            func.coalesce(popularity.c.orders_count_7d, 0).label("orders_count_7d"),
        )
        .outerjoin(popularity, popularity.c.restaurant_id == Restaurant.id)
        .where(where_clause),
        None,
        None,
        None,
    )
    row = (await session.execute(stmt)).one_or_none()
    if row is None:
        return None
    return row[0], int(row[1] or 0)


async def list_public_restaurants_with_popularity(
    session: AsyncSession,
    name: str | None,
    is_hiring: bool | None,
    is_open: bool | None,
    sort: str,
    direction: str,
    offset: int,
    limit: int,
) -> list[tuple[Restaurant, int]]:
    popularity = _popularity_subquery()
    popularity_expr = func.coalesce(popularity.c.orders_count_7d, 0)
    stmt = _apply_public_filters(
        select(Restaurant, popularity_expr.label("orders_count_7d")).outerjoin(
            popularity, popularity.c.restaurant_id == Restaurant.id
        ),
        name,
        is_hiring,
        is_open,
    )
    sort_direction = asc if direction == SortDirection.ASC.value else desc
    if sort == RestaurantSort.RATING.value:
        stmt = stmt.order_by(sort_direction(Restaurant.average_rating), Restaurant.name)
    elif sort == RestaurantSort.POPULARITY_7D.value:
        stmt = stmt.order_by(sort_direction(popularity_expr), Restaurant.name)
    else:
        stmt = stmt.order_by(Restaurant.name)
    rows = (await session.execute(stmt.offset(offset).limit(limit))).all()
    return [(row[0], int(row[1] or 0)) for row in rows]


async def count_public_restaurants(
    session: AsyncSession,
    name: str | None,
    is_hiring: bool | None,
    is_open: bool | None,
) -> int:
    stmt = _apply_public_filters(select(func.count(Restaurant.id)), name, is_hiring, is_open)
    return cast("int", (await session.execute(stmt)).scalar_one())


async def get_working_hours_for_restaurants(
    session: AsyncSession, restaurant_ids: list[uuid.UUID]
) -> dict[uuid.UUID, list[WorkingHours]]:
    rows = (
        (
            await session.execute(
                select(WorkingHours).where(WorkingHours.restaurant_id.in_(restaurant_ids))
            )
        )
        .scalars()
        .all()
    )
    hours_by_restaurant: dict[uuid.UUID, list[WorkingHours]] = {}
    for entry in rows:
        hours_by_restaurant.setdefault(entry.restaurant_id, []).append(entry)
    return hours_by_restaurant
