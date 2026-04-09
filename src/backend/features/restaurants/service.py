import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import (
    create_restaurant_in_db,
    get_vendor_restaurants_from_db,
    update_restaurant_in_db,
)
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate


async def register_new_restaurant(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: uuid.UUID
):
    return await create_restaurant_in_db(session, restaurant_data, vendor_id)


async def update_restaurant_logic(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    update_data: RestaurantUpdate,
    vendor_id: uuid.UUID,
):
    restaurant = await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    return await update_restaurant_in_db(session, restaurant, update_data)


async def get_my_restaurants(session: AsyncSession, vendor_id: uuid.UUID):
    return await get_vendor_restaurants_from_db(session, vendor_id)
