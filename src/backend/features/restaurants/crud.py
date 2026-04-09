from sqlalchemy.ext.asyncio import AsyncSession

from features import Restaurant
from features.restaurants.schemas import RestaurantCreate


async def create_restaurant_in_db(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: int
) -> Restaurant:
    new_restaurant = Restaurant(**restaurant_data.model_dump(), vendor_id=vendor_id)
    session.add(new_restaurant)
    await session.commit()
    return new_restaurant
