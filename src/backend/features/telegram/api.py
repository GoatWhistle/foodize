from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.schemas import TokenResponse
from features.telegram import service
from features.telegram.schemas import (
    TelegramCheckRequest,
    TelegramCheckResponse,
    TelegramRegisterRequest,
)
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
