from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.users import service
from features.users.schemas import UserCreate, UserRead

router = APIRouter(prefix="/users", tags=["Users"])


@router.post(
    "/",
    response_model=UserCreate,
)
async def create_user(
    user_in: UserCreate,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.register_new_user(session=session, user_in=user_in)


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return {"user_id": "hello world"}
