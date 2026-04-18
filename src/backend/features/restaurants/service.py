import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants import crud
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from features.restaurants.schemas import RestaurantCreate, RestaurantResponse, RestaurantUpdate


async def create_restaurant_for_vendor(
    session: AsyncSession, restaurant_data: RestaurantCreate, vendor_id: uuid.UUID
) -> RestaurantResponse:
    restaurant = await crud.create_restaurant(session, restaurant_data, vendor_id)
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


async def get_all_restaurants_public(
    session: AsyncSession,
    name: str | None = None,
    is_hiring: bool | None = None,
    is_open: bool | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[RestaurantResponse], int]:
    offset = (page - 1) * size
    data = await crud.get_all_restaurants(
        session, name=name, is_hiring=is_hiring, is_open=is_open, offset=offset, limit=size
    )
    total = await crud.count_restaurants(session, name=name, is_hiring=is_hiring, is_open=is_open)
    return [RestaurantResponse.model_validate(r) for r in data], total
