import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants import crud
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate, RestaurantResponse, RestaurantUpdate
from features.reviews.models import Review


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
) -> tuple[list[Restaurant], int]:
    offset = (page - 1) * size

    query = (
        select(
            Restaurant,
            func.coalesce(func.avg(Review.rating), 0).label("average_rating"),
            func.count(Review.id).label("review_count"),
        )
        .outerjoin(Review, Review.restaurant_id == Restaurant.id)
        .group_by(Restaurant.id)
    )

    if name:
        query = query.where(Restaurant.name.ilike(f"%{name}%"))
    if is_hiring is not None:
        query = query.where(Restaurant.is_hiring == is_hiring)
    if is_open is not None:
        query = query.where(Restaurant.is_open == is_open)

    result = await session.execute(query.offset(offset).limit(size))

    restaurants_with_ratings = []
    for row in result.all():
        res_obj = row[0]
        res_obj.average_rating = round(float(row[1]), 1)
        res_obj.review_count = row[2]
        restaurants_with_ratings.append(res_obj)

    total_query = select(func.count(Restaurant.id))
    if name:
        total_query = total_query.where(Restaurant.name.ilike(f"%{name}%"))

    total_result = await session.execute(total_query)
    total = total_result.scalar_one()

    return restaurants_with_ratings, total
