import time
import uuid

import jwt
from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.exceptions import (
    AccountDeactivatedException,
    InvalidRefreshTokenException,
    InvalidTokenException,
    InvalidTokenTypeException,
    RefreshTokenAlreadyUsedException,
    RefreshTokenExpiredException,
    RefreshTokenMissingException,
    SessionExpiredException,
    TokenExpiredException,
    TokenRevokedException,
)
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
from shared.exceptions.existence import AuthException, NotAuthenticatedException
from utils.jwt_tokens import create_access_token, create_refresh_token, decode_jwt
from utils.logging_setup import get_logger

logger = get_logger()

_REFRESH_BLACKLIST_PREFIX = "refresh_blacklist:"
_ACCESS_BLACKLIST_PREFIX = "access_blacklist:"


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
        raise NotAuthenticatedException()
    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise TokenExpiredException() from None
    except jwt.InvalidTokenError:
        raise InvalidTokenException() from None
    if payload.get("typ") != "access":
        raise InvalidTokenTypeException()
    if user_id is None:
        raise AuthException()
    try:
        parsed_user_id = uuid.UUID(user_id)
    except ValueError:
        raise InvalidTokenException() from None
    jti = payload.get("jti")
    if jti and await cache.exists(f"{_ACCESS_BLACKLIST_PREFIX}{jti}"):
        raise TokenRevokedException()
    user = await get_user_by_id_or_404(session, parsed_user_id)
    if not user.is_active:
        raise AccountDeactivatedException()
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
) -> TokenResponse:
    user = await get_user_by_phone_or_401(session, user_data)
    return issue_user_tokens(user=user)


def issue_user_tokens(user: User) -> TokenResponse:
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    return TokenResponse(
        access_token=access_token, refresh_token=refresh_token, token_type="Bearer"
    )


async def _blacklist_token(
    cache: RedisCache, token: str | None, prefix: str, token_kind: str
) -> None:
    if not token:
        return
    try:
        payload = decode_jwt(token)
        ttl = payload.get("exp", 0) - int(time.time())
        jti = payload.get("jti")
        if ttl > 0 and jti:
            await cache.set(f"{prefix}{jti}", "1", ttl=ttl)
    except jwt.InvalidTokenError:
        return
    except Exception:
        logger.warning("logout: failed to blacklist %s token", token_kind, exc_info=True)


async def logout_user(
    request: Request,
    cache: RedisCache | None = None,
) -> None:
    if cache is None:
        cache = get_redis_cache()

    access_token = request.cookies.get("access_token") or await _get_bearer_token(request)
    await _blacklist_token(cache, access_token, _ACCESS_BLACKLIST_PREFIX, "access")
    refresh_token = request.cookies.get("refresh_token")
    await _blacklist_token(cache, refresh_token, _REFRESH_BLACKLIST_PREFIX, "refresh")


def _decode_refresh_payload(token: str) -> tuple[dict[str, object], uuid.UUID]:
    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except jwt.ExpiredSignatureError:
        raise RefreshTokenExpiredException() from None
    except jwt.InvalidTokenError:
        raise InvalidRefreshTokenException() from None
    if payload.get("typ") != "refresh":
        raise InvalidTokenTypeException()
    if user_id is None:
        raise AuthException()
    try:
        return payload, uuid.UUID(str(user_id))
    except ValueError:
        raise InvalidRefreshTokenException() from None


async def _consume_refresh_token(cache: RedisCache, payload: dict[str, object]) -> None:
    now = int(time.time())
    session_exp = payload.get("session_exp")
    if isinstance(session_exp, int) and session_exp < now:
        raise SessionExpiredException()
    jti = payload.get("jti")
    if not jti:
        raise InvalidRefreshTokenException()
    expires_at = payload.get("exp")
    ttl = (expires_at if isinstance(expires_at, int) else 0) - now
    if ttl <= 0:
        raise RefreshTokenExpiredException()
    blacklisted = await cache.set_nx(f"{_REFRESH_BLACKLIST_PREFIX}{jti}", "1", ttl=ttl)
    if not blacklisted:
        raise RefreshTokenAlreadyUsedException()


async def refresh_user_token(
    request: Request,
    session: AsyncSession,
    cache: RedisCache | None = None,
) -> TokenResponse:
    token = request.cookies.get("refresh_token") or await _get_bearer_token(request)
    if not token:
        raise RefreshTokenMissingException()
    payload, parsed_user_id = _decode_refresh_payload(token)

    if cache is None:
        cache = get_redis_cache()
    await _consume_refresh_token(cache, payload)

    user = await get_user_by_id_or_404(session, parsed_user_id)
    if not user.is_active:
        raise AccountDeactivatedException()

    session_exp = payload.get("session_exp")
    access_token = create_access_token(user.id)
    new_refresh_token = create_refresh_token(
        user.id, session_exp=session_exp if isinstance(session_exp, int) else None
    )
    return TokenResponse(
        access_token=access_token, refresh_token=new_refresh_token, token_type="Bearer"
    )
