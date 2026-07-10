import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.models import Restaurant
from shared.exceptions.existence import NotFoundException


async def get_restaurant_and_check_ownership(
    session: AsyncSession, restaurant_id: uuid.UUID, vendor_id: uuid.UUID
) -> Restaurant:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant or restaurant.vendor_id != vendor_id:
        raise NotFoundException()
    return restaurant
