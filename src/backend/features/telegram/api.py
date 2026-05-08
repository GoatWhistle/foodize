import secrets

from fastapi import APIRouter, Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.schemas import TokenResponse
from features.telegram import service
from features.telegram.schemas import (
    TelegramBotLinkRequest,
    TelegramCheckRequest,
    TelegramCheckResponse,
    TelegramRegisterRequest,
)
from features.users.schemas import UserRead
from settings.config.app_config import settings
from shared.exceptions import AccessDeniedException
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix="/telegram", tags=["Telegram"])


@router.post("/check", response_model=SuccessResponse[TelegramCheckResponse])
async def telegram_check(
    data: TelegramCheckRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramCheckResponse]:
    result = await service.telegram_check(session=session, init_data=data.init_data)
    return build_response(result)


@router.post("/register", response_model=SuccessResponse[TokenResponse])
async def telegram_register(
    data: TelegramRegisterRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TokenResponse]:
    result = await service.telegram_register(
        session=session,
        init_data=data.init_data,
        phone_number=data.phone_number,
        name=data.name,
    )
    return build_response(result)


@router.post("/auth", response_model=SuccessResponse[TokenResponse])
async def telegram_auth(
    data: TelegramCheckRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TokenResponse]:
    result = await service.telegram_auth_existing(session=session, init_data=data.init_data)
    return build_response(result)


@router.post("/bot/link-phone", response_model=SuccessResponse[UserRead])
async def telegram_bot_link_phone(
    data: TelegramBotLinkRequest,
    x_telegram_bot_secret: str = Header("", alias="X-Telegram-Bot-Secret"),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead]:
    if not settings.telegram.bot_api_secret or not secrets.compare_digest(
        settings.telegram.bot_api_secret, x_telegram_bot_secret
    ):
        raise AccessDeniedException(detail="Invalid bot secret")

    result = await service.link_phone_from_bot(
        session=session,
        telegram_id=data.telegram_id,
        telegram_username=data.telegram_username,
        phone_number=data.phone_number,
        name=data.name,
    )
    return build_response(UserRead.model_validate(result))
