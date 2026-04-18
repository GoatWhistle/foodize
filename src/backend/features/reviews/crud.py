import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.reviews.models import Review
from features.reviews.schemas import ReviewCreate


async def create_review(
    session: AsyncSession,
    review_data: ReviewCreate,
    user_id: uuid.UUID,
    restaurant_id: uuid.UUID,
) -> Review:
    review = Review(
        user_id=user_id,
        restaurant_id=restaurant_id,
        **review_data.model_dump(),
    )
    session.add(review)
    await session.commit()
    await session.refresh(review)
    return review


async def get_reviews_by_restaurant(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    offset: int = 0,
    limit: int = 20,
) -> list[Review]:
    result = await session.execute(
        select(Review)
        .where(Review.restaurant_id == restaurant_id)
        .order_by(Review.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_reviews_by_restaurant(session: AsyncSession, restaurant_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count()).select_from(Review).where(Review.restaurant_id == restaurant_id)
    )
    return result.scalar_one()


async def get_user_review_for_restaurant(
    session: AsyncSession, user_id: uuid.UUID, restaurant_id: uuid.UUID
) -> Review | None:
    result = await session.execute(
        select(Review).where(
            Review.user_id == user_id,
            Review.restaurant_id == restaurant_id,
        )
    )
    return result.scalar_one_or_none()


async def get_restaurant_avg_rating(
    session: AsyncSession, restaurant_id: uuid.UUID
) -> tuple[float | None, int]:
    result = await session.execute(
        select(func.avg(Review.rating), func.count(Review.id)).where(
            Review.restaurant_id == restaurant_id
        )
    )
    avg, count = result.one()
    return (round(float(avg), 2) if avg is not None else None, count)
