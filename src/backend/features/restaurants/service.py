import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from features.orders.models.order import Order
from features.restaurants import crud
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.models import Restaurant
from features.restaurants.schemas import (
    RestaurantCreate,
    RestaurantResponse,
    RestaurantUpdate,
)
from features.vendors.models import VendorProfile
from shared.enums.permissions import Permission
from shared.permissions import has_permission


async def create_restaurant_for_vendor(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: uuid.UUID
) -> RestaurantResponse:
    restaurant = await crud.create_restaurant(session, restaurant_data, vendor_id)
    vendor = (
        await session.execute(
            select(VendorProfile)
            .where(VendorProfile.id == vendor_id)
            .options(selectinload(VendorProfile.user))
        )
    ).scalar_one_or_none()
    if vendor and has_permission(vendor.user.permissions, Permission.RESTAURANTS_MODERATE):
        restaurant.moderation_status = "APPROVED"
        restaurant.rejection_reason = None
        await session.commit()
        await session.refresh(restaurant)
    return RestaurantResponse.model_validate(restaurant)


async def update_restaurant_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    update_data: RestaurantUpdate,
    vendor_id: uuid.UUID,
) -> RestaurantResponse:
    restaurant = await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    updated = await crud.update_restaurant(session, restaurant, update_data)
    return RestaurantResponse.model_validate(updated)


async def get_my_restaurants(
    session: AsyncSession,
    vendor_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
) -> tuple[list[RestaurantResponse], int]:
    offset = (page - 1) * size
    data = await crud.get_vendor_restaurants(session, vendor_id, offset=offset, limit=size)
    total = await crud.count_vendor_restaurants(session, vendor_id)
    return [RestaurantResponse.model_validate(r) for r in data], total


def _apply_restaurant_filters(
    query,
    name: str | None,
    is_hiring: bool | None,
    is_open: bool | None,
):
    query = query.where(Restaurant.is_active.is_(True))
    if name:
        query = query.where(Restaurant.name.ilike(f"%{name}%"))
    if is_hiring is not None:
        query = query.where(Restaurant.is_hiring == is_hiring)
    if is_open is not None:
        query = query.where(Restaurant.is_open == is_open)
    query = query.where(Restaurant.moderation_status == "APPROVED")
    return query


async def get_restaurant_public(
    session: AsyncSession,
    identifier: str | uuid.UUID,
) -> RestaurantResponse:
    try:
        if isinstance(identifier, str):
            parsed_uuid = uuid.UUID(identifier)
        else:
            parsed_uuid = identifier
        where_clause = Restaurant.id == parsed_uuid
    except ValueError:
        where_clause = Restaurant.display_id == str(identifier)

    since = datetime.now(timezone.utc) - timedelta(days=7)
    popularity_subquery = (
        select(Order.restaurant_id, func.count(Order.id).label("orders_count_7d"))
        .where(Order.created_at >= since)
        .group_by(Order.restaurant_id)
        .subquery()
    )
    result = await session.execute(
        _apply_restaurant_filters(
            select(
                Restaurant,
                func.coalesce(popularity_subquery.c.orders_count_7d, 0).label(
                    "orders_count_7d"
                ),
            )
            .outerjoin(
                popularity_subquery,
                popularity_subquery.c.restaurant_id == Restaurant.id,
            )
            .where(where_clause),
            None,
            None,
            None,
        )
    )
    row = result.one_or_none()
    if not row:
        raise RestaurantNotFoundException()
    restaurant = row[0]
    restaurant.orders_count_7d = int(row[1] or 0)
    return RestaurantResponse.model_validate(restaurant)


async def get_all_restaurants_public(
    session: AsyncSession,
    name: str | None = None,
    is_hiring: bool | None = None,
    is_open: bool | None = None,
    sort: str = "default",
    direction: str = "desc",
    page: int = 1,
    size: int = 20,
) -> tuple[list[RestaurantResponse], int]:
    offset = (page - 1) * size
    since = datetime.now(timezone.utc) - timedelta(days=7)
    popularity_subquery = (
        select(Order.restaurant_id, func.count(Order.id).label("orders_count_7d"))
        .where(Order.created_at >= since)
        .group_by(Order.restaurant_id)
        .subquery()
    )
    popularity_expr = func.coalesce(popularity_subquery.c.orders_count_7d, 0)

    query = _apply_restaurant_filters(
        select(Restaurant, popularity_expr.label("orders_count_7d")).outerjoin(
            popularity_subquery,
            popularity_subquery.c.restaurant_id == Restaurant.id,
        ),
        name,
        is_hiring,
        is_open,
    )
    sort_direction = asc if direction == "asc" else desc
    if sort == "rating":
        query = query.order_by(sort_direction(Restaurant.average_rating), Restaurant.name)
    elif sort == "popularity_7d":
        query = query.order_by(sort_direction(popularity_expr), Restaurant.name)
    else:
        query = query.order_by(Restaurant.name)
    result = await session.execute(query.offset(offset).limit(size))
    restaurants = []
    for row in result.all():
        restaurant = row[0]
        restaurant.orders_count_7d = int(row[1] or 0)
        restaurants.append(RestaurantResponse.model_validate(restaurant))

    total_query = _apply_restaurant_filters(
        select(func.count(Restaurant.id)), name, is_hiring, is_open
    )
    total = (await session.execute(total_query)).scalar_one()

    return restaurants, total
