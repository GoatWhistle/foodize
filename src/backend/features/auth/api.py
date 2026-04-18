from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth import service
from features.auth.schemas import TokenResponse, UserLogin
from features.users.schemas import UserCreate, UserRead

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=UserRead)
async def create_registration(
    user_in: UserCreate,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> UserRead:
    return await service.register_user(session=session, user_data=user_in)


@router.post("/login", response_model=TokenResponse)
async def create_login(
    response: Response,
    user_in: UserLogin,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> TokenResponse:
    return await service.login_user(session=session, user_data=user_in, response=response)


@router.post("/refresh", response_model=TokenResponse)
async def create_refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> TokenResponse:
    return await service.refresh_user_token(request=request, response=response, session=session)
