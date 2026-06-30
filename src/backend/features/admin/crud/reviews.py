import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.schemas import AdminReviewResponse
from features.restaurants.models import Restaurant
from features.reviews.models import Review
from features.users.models import User


async def get_all_reviews(
    session: AsyncSession,
    rating: int | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[AdminReviewResponse]:
    stmt = (
        select(
            Review,
            User.name.label("user_name"),
            User.phone_number.label("user_phone"),
            Restaurant.name.label("restaurant_name"),
        )
        .join(User, User.id == Review.user_id)
        .join(Restaurant, Restaurant.id == Review.restaurant_id)
        .where(Review.deleted_at.is_(None))
        .order_by(Review.created_at.desc())
    )
    if rating is not None:
        stmt = stmt.where(Review.rating == rating)
    stmt = stmt.offset(offset).limit(limit)
    result = await session.execute(stmt)
    return [
        AdminReviewResponse(
            id=row[0].id,
            user_id=row[0].user_id,
            user_name=row[1],
            user_phone=row[2],
            restaurant_id=row[0].restaurant_id,
            restaurant_name=row[3],
            rating=row[0].rating,
            text=row[0].text,
            is_verified_purchase=row[0].is_verified_purchase,
            created_at=row[0].created_at,
        )
        for row in result.all()
    ]


async def count_all_reviews(session: AsyncSession, rating: int | None = None) -> int:
    stmt = select(func.count()).select_from(Review).where(Review.deleted_at.is_(None))
    if rating is not None:
        stmt = stmt.where(Review.rating == rating)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_review_by_id(session: AsyncSession, review_id: uuid.UUID) -> Review | None:
    result = await session.execute(
        select(Review).where(Review.id == review_id, Review.deleted_at.is_(None))
    )
    return result.scalar_one_or_none()


async def delete_review(session: AsyncSession, review: Review) -> Review:
    review.deleted_at = datetime.now(UTC)
    await session.flush()
    await session.refresh(review)
    return review


async def batch_delete_reviews(session: AsyncSession, ids: list[uuid.UUID]) -> int:
    result = await session.execute(
        update(Review)
        .where(Review.id.in_(ids), Review.deleted_at.is_(None))
        .values(deleted_at=datetime.now(UTC))
    )
    return result.rowcount  # type: ignore[attr-defined]
