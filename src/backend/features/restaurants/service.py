import uuid
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from features.restaurants.models import Restaurant

from features.restaurants.crud import (
    count_restaurants,
    create_restaurant,
    get_all_restaurants,
    get_vendor_restaurants,
    update_restaurant,
)
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate


async def create_restaurant_for_vendor(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: uuid.UUID
) -> "Restaurant":
    return await create_restaurant(session, restaurant_data, vendor_id)


async def update_restaurant_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    update_data: RestaurantUpdate,
    vendor_id: uuid.UUID,
) -> "Restaurant":
    restaurant = await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    return await update_restaurant(session, restaurant, update_data)


async def get_my_restaurants(session: AsyncSession, vendor_id: uuid.UUID) -> list["Restaurant"]:
    return await get_vendor_restaurants(session, vendor_id)


async def get_all_restaurants_public(
    session: AsyncSession,
    name: str | None = None,
    is_hiring: bool | None = None,
    is_open: bool | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list, int]:
    offset = (page - 1) * size
    data = await get_all_restaurants(
        session,
        name=name,
        is_hiring=is_hiring,
        is_open=is_open,
        offset=offset,
        limit=size,
    )
    total = await count_restaurants(session, name=name, is_hiring=is_hiring, is_open=is_open)
    return data, total
