import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.users.dependencies import get_user_by_id_or_404
from features.users.models import User
from features.users.schemas import UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/{user_id}", response_model=UserRead)
async def read_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> UserRead:
    user = await get_user_by_id_or_404(session=session, user_id=user_id)
    return UserRead.model_validate(user)


@router.get("/", response_model=UserRead)
async def read_my_profile(
    current_user: User = Depends(get_current_user),
) -> UserRead:
    return UserRead.model_validate(current_user)
