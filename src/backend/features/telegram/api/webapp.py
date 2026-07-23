from http import HTTPStatus

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth import service as auth_service
from features.auth.cookies import (
    clear_auth_cookies,
    set_auth_cookies,
    set_telegram_auth_cookies,
)
from features.auth.schemas import TokenResponse
from features.auth.service import get_current_user
from features.telegram import site_login, webapp_auth
from features.telegram.schemas import (
    TelegramCheckRequest,
    TelegramCheckResponse,
    TelegramRegisterRequest,
    TelegramSiteLoginByUsernameRequest,
    TelegramSiteLoginResponse,
    TelegramSiteLoginStartRequest,
    TelegramSiteLoginStartResponse,
    TelegramSiteLoginVerifyByUsernameRequest,
    TelegramSiteLoginVerifyRequest,
    TelegramSitePasswordRequest,
)
from features.users.models import User
from features.users.schemas import UserRead
from infra.cache.redis import RedisCache, redis_cache_dependency
from middlewares.limiter import limiter
from settings.config.app_config import settings
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(
    prefix=settings.api.v1.telegram_webapp.prefix, tags=[settings.api.v1.telegram_webapp.tag]
)


@router.post("/check", response_model=SuccessResponse[TelegramCheckResponse])
@limiter.limit("20/minute")
async def telegram_check(
    request: Request,
    data: TelegramCheckRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramCheckResponse]:
    result = await webapp_auth.telegram_check(session=session, init_data=data.init_data)
    return build_response(result)


@router.post("/register", response_model=SuccessResponse[TokenResponse])
@limiter.limit("10/minute")
async def telegram_register(
    request: Request,
    data: TelegramRegisterRequest,
    response: Response,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TokenResponse]:
    result = await webapp_auth.telegram_register(
        session=session,
        init_data=data.init_data,
        phone_number=data.phone_number,
        name=data.name,
    )
    set_telegram_auth_cookies(response, result)
    return build_response(result)


@router.post("/auth", response_model=SuccessResponse[TokenResponse])
@limiter.limit("10/minute")
async def telegram_auth(
    request: Request,
    data: TelegramCheckRequest,
    response: Response,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TokenResponse]:
    result = await webapp_auth.telegram_auth_existing(session=session, init_data=data.init_data)
    set_telegram_auth_cookies(response, result)
    return build_response(result)


@router.post("/refresh", response_model=SuccessResponse[TokenResponse])
@limiter.limit("30/minute")
async def telegram_refresh(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
    cache: RedisCache = Depends(redis_cache_dependency),
) -> SuccessResponse[TokenResponse]:
    result = await auth_service.refresh_user_token(request=request, session=session, cache=cache)
    set_auth_cookies(response, result, same_site="none")
    return build_response(result)


@router.post("/session-logout", status_code=HTTPStatus.NO_CONTENT)
@limiter.limit("20/minute")
async def telegram_session_logout(
    request: Request,
    response: Response,
    cache: RedisCache = Depends(redis_cache_dependency),
) -> None:
    await auth_service.logout_user(request=request, cache=cache)
    clear_auth_cookies(response, same_site="none")


@router.post(
    "/site-login/request-code",
    response_model=SuccessResponse[TelegramSiteLoginStartResponse],
)
@limiter.limit("5/minute")
async def telegram_site_login_request_code(
    request: Request,
    data: TelegramSiteLoginStartRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramSiteLoginStartResponse]:
    await site_login.request_site_login_code(session=session, phone_number=data.phone_number)
    return build_response(TelegramSiteLoginStartResponse())


@router.post(
    "/site-login/request-code-by-username",
    response_model=SuccessResponse[TelegramSiteLoginStartResponse],
)
@limiter.limit("5/minute")
async def telegram_site_login_request_code_by_username(
    request: Request,
    data: TelegramSiteLoginByUsernameRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramSiteLoginStartResponse]:
    await site_login.request_site_login_code_by_username(
        session=session, telegram_username=data.telegram_username
    )
    return build_response(TelegramSiteLoginStartResponse())


@router.post(
    "/site-login/verify",
    response_model=SuccessResponse[TelegramSiteLoginResponse],
)
@limiter.limit("5/minute")
async def telegram_site_login_verify(
    request: Request,
    data: TelegramSiteLoginVerifyRequest,
    response: Response,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramSiteLoginResponse]:
    result = await site_login.verify_site_login_code(
        session=session,
        phone_number=data.phone_number,
        code=data.code,
    )
    set_auth_cookies(response, result, same_site="none")
    return build_response(result)


@router.post(
    "/site-login/verify-by-username",
    response_model=SuccessResponse[TelegramSiteLoginResponse],
)
@limiter.limit("5/minute")
async def telegram_site_login_verify_by_username(
    request: Request,
    data: TelegramSiteLoginVerifyByUsernameRequest,
    response: Response,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramSiteLoginResponse]:
    result = await site_login.verify_site_login_code_by_username(
        session=session,
        telegram_username=data.telegram_username,
        code=data.code,
    )
    set_auth_cookies(response, result, same_site="none")
    return build_response(result)


@router.post("/site-login/password", response_model=SuccessResponse[UserRead])
@limiter.limit("5/minute")
async def telegram_site_login_set_password(
    request: Request,
    data: TelegramSitePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead]:
    result = await site_login.set_site_password(
        session=session,
        user=current_user,
        password=data.password,
    )
    return build_response(UserRead.model_validate(result))


@router.post("/logout", response_model=SuccessResponse[UserRead])
async def telegram_logout(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead]:
    result = await webapp_auth.unlink_telegram_for_user(session=session, user=current_user)
    return build_response(UserRead.model_validate(result))
