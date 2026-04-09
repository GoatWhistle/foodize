from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import create_restaurant_in_db
from features.restaurants.schemas import RestaurantCreate


async def register_new_restaurant(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: int
):

    return await create_restaurant_in_db(session, restaurant_data, vendor_id)
