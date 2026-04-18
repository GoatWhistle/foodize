import uuid
from typing import TYPE_CHECKING

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.reviews import service
from features.reviews.schemas import RatingResponse, ReviewCreate, ReviewResponse
from features.users.models import User

if TYPE_CHECKING:
    from features.reviews.models import Review

router = APIRouter(prefix="/restaurants", tags=["Reviews"])


@router.post(
    "/{restaurant_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    restaurant_id: uuid.UUID,
    review_in: ReviewCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> "Review":
    return await service.create_review_for_user(
        session=session,
        review_data=review_in,
        user_id=current_user.id,
        restaurant_id=restaurant_id,
    )


@router.get("/{restaurant_id}/reviews", response_model=list[ReviewResponse])
async def read_reviews(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> list["Review"]:
    return await service.list_reviews_for_restaurant(session=session, restaurant_id=restaurant_id)


@router.get("/{restaurant_id}/rating", response_model=RatingResponse)
async def read_rating(
    restaurant_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> RatingResponse:
    return await service.get_rating_for_restaurant(session=session, restaurant_id=restaurant_id)
