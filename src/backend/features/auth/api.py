from http import HTTPStatus

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth import service
from features.auth.cookies import clear_auth_cookies, set_auth_cookies
from features.auth.schemas import TokenResponse, UserLogin
from features.users.schemas import UserCreate, UserRead
from infra.cache.redis import RedisCache, redis_cache_dependency
from middlewares.limiter import limiter
from settings.config.app_config import settings
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix=settings.api.v1.auth.prefix, tags=[settings.api.v1.auth.tag])


@router.post("/register", response_model=SuccessResponse[UserRead])
@limiter.limit(lambda: settings.auth.rate_limit_register)
async def create_registration(
    request: Request,
    user_in: UserCreate,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead]:
    result = await service.register_user(session=session, user_data=user_in)
    return build_response(result)


@router.post("/login", response_model=SuccessResponse[TokenResponse])
@limiter.limit(lambda: settings.auth.rate_limit_login)
async def create_login(
    request: Request,
    response: Response,
    user_in: UserLogin,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TokenResponse]:
    result = await service.login_user(session=session, user_data=user_in)
    set_auth_cookies(response, result)
    return build_response(result)


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
@limiter.limit("30/minute")
async def create_refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    cache: RedisCache = Depends(redis_cache_dependency),
) -> SuccessResponse[TokenResponse]:
    result = await service.refresh_user_token(request=request, session=session, cache=cache)
    set_auth_cookies(response, result)
    return build_response(result)


@router.post("/logout", status_code=HTTPStatus.NO_CONTENT)
@limiter.limit("20/minute")
async def create_logout(
    request: Request,
    response: Response,
    cache: RedisCache = Depends(redis_cache_dependency),
) -> None:
    await service.logout_user(request=request, cache=cache)
    clear_auth_cookies(response)
