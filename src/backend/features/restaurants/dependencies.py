import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.models import Restaurant


async def get_restaurant_and_check_ownership(
    session: AsyncSession, restaurant_id: uuid.UUID, vendor_id: uuid.UUID
) -> Restaurant:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant or restaurant.vendor_id != vendor_id:
        raise RestaurantNotFoundException()
    return restaurant
