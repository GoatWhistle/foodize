import uuid

from fastapi import Depends, Request, Response
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.schemas import TokenResponse, UserLogin
from features.users import crud as users_crud
from features.users.dependencies import (
    ensure_user_not_exists_by_phone,
    get_user_by_id_or_404,
    get_user_by_phone_or_401,
)
from features.users.models import User
from features.users.schemas import UserCreate, UserRead
from settings.config.app_config import settings
from shared.exceptions.existence import AuthException
from utils.JWT import create_access_token, create_refresh_token, decode_jwt


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.auth.access_token_lifetime_seconds,
        samesite="lax",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.auth.refresh_token_lifetime_seconds,
        samesite="lax",
    )


class OAuth2PasswordBearerWithCookie(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> str | None:
        token = request.cookies.get("access_token")
        if token:
            return token
        auth_header = await super().__call__(request)
        if auth_header:
            return auth_header
        return None


OAuth2_scheme = OAuth2PasswordBearerWithCookie(
    tokenUrl="/api/auth/token",
    auto_error=False,
)


async def get_current_user(
    token: str = Depends(OAuth2_scheme),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> User:
    if not token:
        raise AuthException(detail="Not authenticated")
    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except Exception:
        raise AuthException()
    if user_id is None:
        raise AuthException()
    user = await get_user_by_id_or_404(session, uuid.UUID(user_id))
    return user


async def register_user(
    session: AsyncSession,
    user_data: UserCreate,
) -> UserRead:
    await ensure_user_not_exists_by_phone(session, user_data.phone_number)
    user = await users_crud.create_user(session, user_data)
    return UserRead.model_validate(user)


async def login_user(
    session: AsyncSession,
    user_data: UserLogin,
    response: Response,
) -> TokenResponse:
    user = await get_user_by_phone_or_401(session, user_data)
    access_token = create_access_token(user.id, str(user.phone_number))
    refresh_token = create_refresh_token(user.id, str(user.phone_number))
    _set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="bearer"
    )


async def refresh_user_token(
    request: Request,
    response: Response,
    session: AsyncSession,
) -> TokenResponse:
    token = request.cookies.get("refresh_token")
    if not token:
        raise AuthException(detail="Refresh token missing")
    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except Exception:
        raise AuthException()
    if user_id is None:
        raise AuthException()
    user = await get_user_by_id_or_404(session, uuid.UUID(user_id))
    access_token = create_access_token(user.id, str(user.phone_number))
    new_refresh_token = create_refresh_token(user.id, str(user.phone_number))
    _set_auth_cookies(response, access_token, new_refresh_token)
    return TokenResponse(
        access_token=access_token, refresh_token=new_refresh_token, token_type="bearer"
    )
