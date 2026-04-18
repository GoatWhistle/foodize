import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.orders.models.order import Order
from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.exceptions import RestaurantNotFoundException
from features.reviews.crud import (
    create_review,
    get_restaurant_avg_rating,
    get_reviews_by_restaurant,
    get_user_review_for_restaurant,
)
from features.reviews.exceptions import ReviewAlreadyExistsException, ReviewNotAllowedException
from features.reviews.models import Review
from features.reviews.schemas import RatingResponse, ReviewCreate
from shared.enums.order_status import OrderStatus


async def _has_completed_order(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> bool:
    result = await session.execute(
        select(Order).where(
            Order.user_id == user_id,
            Order.restaurant_id == restaurant_id,
            Order.status == OrderStatus.COMPLETED,
        )
    )
    return result.scalar_one_or_none() is not None


async def create_review_for_user(
    session: AsyncSession,
    review_data: ReviewCreate,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
) -> Review:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()

    if not await _has_completed_order(session, user_id, restaurant_id):
        raise ReviewNotAllowedException()

    existing = await get_user_review_for_restaurant(session, user_id, restaurant_id)
    if existing:
        raise ReviewAlreadyExistsException()

    return await create_review(session, review_data, user_id, restaurant_id)


async def list_reviews_for_restaurant(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> list[Review]:
    return await get_reviews_by_restaurant(session, restaurant_id)


async def get_rating_for_restaurant(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> RatingResponse:
    avg, count = await get_restaurant_avg_rating(session, restaurant_id)
    return RatingResponse(restaurant_id=restaurant_id, average_rating=avg, review_count=count)
