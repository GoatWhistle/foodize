import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features import Restaurant
from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate


async def create_restaurant_in_db(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: uuid.UUID
) -> Restaurant:
    new_restaurant = Restaurant(**restaurant_data.model_dump(), vendor_id=vendor_id)
    session.add(new_restaurant)
    await session.commit()
    return new_restaurant


async def update_restaurant_in_db(
    session: AsyncSession, restaurant: Restaurant, update_data: RestaurantUpdate
) -> Restaurant:
    data = update_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(restaurant, key, value)
    await session.commit()
    await session.refresh(restaurant)
    return restaurant


async def get_vendor_restaurants_from_db(
    session: AsyncSession, vendor_id: uuid.UUID
) -> list[Restaurant]:
    stmt = select(Restaurant).where(Restaurant.vendor_id == vendor_id).order_by(Restaurant.id)
    result = await session.execute(stmt)
    return list(result.scalars().all())
