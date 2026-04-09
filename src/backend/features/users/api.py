import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features import User
from features.auth.service import get_current_user
from features.users.dependencies import get_user_by_id_or_404
from features.users.schemas import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await get_user_by_id_or_404(session=session, user_id=user_id)


@router.get(
    "/",
    response_model=UserRead,
)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user
