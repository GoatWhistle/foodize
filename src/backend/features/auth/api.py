from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from database import db_helper
from features.auth import service
from features.auth.schemas import TokenResponse, UserLogin
from features.users.schemas import UserCreate, UserRead
router = APIRouter(tags=["Auth"])
@router.post("/register", response_model=UserRead)
async def register(
    user_in: UserCreate,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.register_user(session=session, user_data=user_in)
@router.post("/login", response_model=TokenResponse)
async def login(
    response: Response,
    user_in: UserLogin,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.login_user(session=session, user_data=user_in, response=response)
