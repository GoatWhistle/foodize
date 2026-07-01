import time
import uuid

import jwt
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
from infra.cache.redis import RedisCache, get_redis_cache, redis_cache_dependency
from settings.config.app_config import settings
from shared.exceptions.existence import AuthException
from utils.JWT import create_access_token, create_refresh_token, decode_jwt
from utils.logging_setup import get_logger

logger = get_logger()

_REFRESH_BLACKLIST_PREFIX = "refresh_blacklist:"
_ACCESS_BLACKLIST_PREFIX = "access_blacklist:"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    secure = settings.logs.environment != "development"
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        max_age=settings.auth.access_token_lifetime_seconds,
        samesite="lax",
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        max_age=settings.auth.refresh_token_lifetime_seconds,
        samesite="lax",
    )


async def _get_bearer_token(request: Request) -> str | None:
    token = await OAuth2PasswordBearer.__call__(OAuth2_scheme, request)
    return token or None


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
    cache: RedisCache = Depends(redis_cache_dependency),
) -> User:
    if not token:
        raise AuthException(detail="Not authenticated")
    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise AuthException(detail="Token has expired")
    except jwt.InvalidTokenError:
        raise AuthException(detail="Invalid token")
    if payload.get("typ") != "access":
        raise AuthException(detail="Invalid token type")
    if user_id is None:
        raise AuthException()
    try:
        parsed_user_id = uuid.UUID(user_id)
    except ValueError:
        raise AuthException(detail="Invalid token")
    if await cache.exists(f"{_ACCESS_BLACKLIST_PREFIX}{token}"):
        raise AuthException(detail="Token has been invalidated")
    user = await get_user_by_id_or_404(session, parsed_user_id)
    if not user.is_active:
        raise AuthException(detail="Account is deactivated")
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
    return issue_user_tokens(user=user, response=response)


def issue_user_tokens(user: User, response: Response) -> TokenResponse:
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    _set_auth_cookies(response, access_token, refresh_token)
    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="Bearer"
    )


async def logout_user(
    request: Request,
    response: Response,
    cache: RedisCache | None = None,
) -> None:
    if cache is None:
        cache = get_redis_cache()
    now = int(time.time())

    access_token = request.cookies.get("access_token") or await _get_bearer_token(request)
    if access_token:
        try:
            payload = decode_jwt(access_token)
            ttl = payload.get("exp", 0) - now
            if ttl > 0:
                await cache.set(f"{_ACCESS_BLACKLIST_PREFIX}{access_token}", "1", ttl=ttl)
        except jwt.InvalidTokenError:
            pass
        except Exception:
            logger.warning("logout: failed to blacklist access token")

    refresh_token = request.cookies.get("refresh_token") or request.headers.get("x-refresh-token")
    if refresh_token:
        try:
            payload = decode_jwt(refresh_token)
            ttl = payload.get("exp", 0) - now
            if ttl > 0:
                await cache.set(f"{_REFRESH_BLACKLIST_PREFIX}{refresh_token}", "1", ttl=ttl)
        except jwt.InvalidTokenError:
            pass
        except Exception:
            logger.warning("logout: failed to blacklist refresh token")

    secure = settings.logs.environment != "development"
    response.delete_cookie("access_token", httponly=True, secure=secure, samesite="lax")
    response.delete_cookie("refresh_token", httponly=True, secure=secure, samesite="lax")


async def refresh_user_token(
    request: Request,
    response: Response,
    session: AsyncSession,
    cache: RedisCache | None = None,
) -> TokenResponse:
    token = (
        request.cookies.get("refresh_token")
        or request.headers.get("x-refresh-token")
        or await _get_bearer_token(request)
    )
    if not token:
        raise AuthException(detail="Refresh token missing")
    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise AuthException(detail="Refresh token has expired")
    except jwt.InvalidTokenError:
        raise AuthException(detail="Invalid refresh token")
    if payload.get("typ") != "refresh":
        raise AuthException(detail="Invalid token type")
    if user_id is None:
        raise AuthException()
    try:
        parsed_user_id = uuid.UUID(user_id)
    except ValueError:
        raise AuthException(detail="Invalid refresh token")

    now = int(time.time())
    session_exp = payload.get("session_exp")
    if session_exp is not None and session_exp < now:
        raise AuthException(detail="Session has expired, please log in again")

    if cache is None:
        cache = get_redis_cache()
    blacklist_key = f"{_REFRESH_BLACKLIST_PREFIX}{token}"
    ttl = payload.get("exp", 0) - now
    if ttl <= 0:
        raise AuthException(detail="Refresh token has expired")
    blacklisted = await cache.set_nx(blacklist_key, "1", ttl=ttl)
    if not blacklisted:
        raise AuthException(detail="Refresh token already used")

    user = await get_user_by_id_or_404(session, parsed_user_id)
    if not user.is_active:
        raise AuthException(detail="Account is deactivated")

    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(user.id, session_exp=session_exp)
    _set_auth_cookies(response, access_token, new_refresh_token)
    return TokenResponse(
        access_token=access_token, refresh_token=new_refresh_token, token_type="Bearer"
    )
