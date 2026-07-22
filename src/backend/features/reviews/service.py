import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import get_restaurant_by_id
from features.restaurants.exceptions import RestaurantNotFoundException
from features.reviews import crud
from features.reviews.exceptions import (
    ReviewLimitExceededException,
    ReviewNotAllowedException,
    ReviewNotFoundException,
)
from features.reviews.models import Review
from features.reviews.schemas import RatingResponse, ReviewCreate, ReviewResponse

MAX_REVIEWS_PER_USER_RESTAURANT = 1


async def _sync_restaurant_rating(session: AsyncSession, restaurant_id: uuid.UUID) -> None:
    await crud.sync_restaurant_rating(session, restaurant_id)


def _review_to_response(review: Review) -> ReviewResponse:
    data = ReviewResponse.model_validate(review)
    user = getattr(review, "user", None)
    data.user_name = getattr(user, "name", None)
    return data


async def create_review_for_user(
    session: AsyncSession,
    review_data: ReviewCreate,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
) -> ReviewResponse:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant or not restaurant.is_active:
        raise RestaurantNotFoundException()

    is_verified = await crud.has_completed_order(session, user_id, restaurant_id)
    if not is_verified:
        raise ReviewNotAllowedException()

    user_reviews_count = await crud.count_user_reviews_for_restaurant(
        session, user_id, restaurant_id
    )
    if user_reviews_count >= MAX_REVIEWS_PER_USER_RESTAURANT:
        raise ReviewLimitExceededException()

    review = await crud.create_review(
        session,
        review_data,
        user_id,
        restaurant_id,
        is_verified_purchase=is_verified,
    )

    await _sync_restaurant_rating(session, restaurant_id)
    await session.flush()

    return _review_to_response(review)


async def delete_review_for_user(
    session: AsyncSession,
    review_id: uuid.UUID,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
) -> ReviewResponse:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()

    review = await crud.get_review_by_id_for_user(session, review_id, user_id, restaurant_id)
    if not review:
        raise ReviewNotFoundException()

    response = _review_to_response(review)
    await crud.delete_review(session, review)

    await _sync_restaurant_rating(session, restaurant_id)
    await session.flush()

    return response


async def update_review_for_user(
    session: AsyncSession,
    review_data: ReviewCreate,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
) -> ReviewResponse:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()

    review = await crud.get_user_review_for_restaurant(session, user_id, restaurant_id)
    if not review:
        raise ReviewNotFoundException()

    updated = await crud.update_review(session, review, review_data)

    await _sync_restaurant_rating(session, restaurant_id)
    await session.flush()

    return _review_to_response(updated)


async def list_reviews_for_restaurant(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
) -> tuple[list[ReviewResponse], int]:
    offset = (page - 1) * size
    data = await crud.get_reviews_by_restaurant(session, restaurant_id, offset=offset, limit=size)
    total = await crud.count_reviews_by_restaurant(session, restaurant_id)
    return [_review_to_response(r) for r in data], total


async def get_rating_for_restaurant(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> RatingResponse:
    restaurant = await get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()
    return RatingResponse(
        restaurant_id=restaurant_id,
        average_rating=(
            float(restaurant.average_rating) if restaurant.average_rating is not None else None
        ),
        review_count=restaurant.review_count,
    )
