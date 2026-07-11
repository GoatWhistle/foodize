from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.telegram import bot_api
from features.telegram.dependencies import enforce_bot_rate_limit, verify_bot_secret
from features.telegram.schemas import (
    TelegramBotLinkRequest,
    TelegramBotOrdersRequest,
    TelegramBotOrderSummary,
    TelegramBotRegisterRequest,
    TelegramBotTelegramIdRequest,
    TelegramBotTelegramIdResponse,
    TelegramBotVendorStatusRequest,
    TelegramBotVendorStatusResponse,
)
from features.users.schemas import UserRead
from shared.response import build_response
from shared.schemas.response import (
    Pagination,
    SuccessListResponse,
    SuccessResponse,
)

router = APIRouter(prefix="/telegram/bot", tags=["Telegram"])


@router.post(
    "/register",
    response_model=SuccessResponse[UserRead],
    dependencies=[Depends(verify_bot_secret)],
)
async def telegram_bot_register(
    data: TelegramBotRegisterRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead]:
    await enforce_bot_rate_limit("bot_register", data.telegram_id, limit=10, ttl=3600)

    result = await bot_api.register_from_bot(
        session=session,
        telegram_id=data.telegram_id,
        telegram_username=data.telegram_username,
        name=data.name,
    )
    return build_response(UserRead.model_validate(result))


@router.post(
    "/link-phone",
    response_model=SuccessResponse[UserRead],
    dependencies=[Depends(verify_bot_secret)],
)
async def telegram_bot_link_phone(
    data: TelegramBotLinkRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead]:
    await enforce_bot_rate_limit("link_phone", data.telegram_id, limit=5, ttl=3600)

    result = await bot_api.link_phone_from_bot(
        session=session,
        telegram_id=data.telegram_id,
        telegram_username=data.telegram_username,
        phone_number=data.phone_number,
        name=data.name,
    )
    return build_response(UserRead.model_validate(result))


@router.post(
    "/vendor-status",
    response_model=SuccessResponse[TelegramBotVendorStatusResponse],
    dependencies=[Depends(verify_bot_secret)],
)
async def telegram_bot_vendor_status(
    data: TelegramBotVendorStatusRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramBotVendorStatusResponse]:
    await enforce_bot_rate_limit("bot_vendor_status", data.telegram_id, limit=20, ttl=60)

    vendor = await bot_api.get_vendor_status_for_telegram_id(
        session=session,
        telegram_id=data.telegram_id,
    )
    if not vendor:
        return build_response(TelegramBotVendorStatusResponse(is_vendor=False))

    return build_response(
        TelegramBotVendorStatusResponse(
            is_vendor=True,
            approval_status=vendor.approval_status,
            rejection_reason=vendor.rejection_reason,
        )
    )


@router.post(
    "/telegram-id",
    response_model=SuccessResponse[TelegramBotTelegramIdResponse],
    dependencies=[Depends(verify_bot_secret)],
)
async def telegram_bot_telegram_id(
    data: TelegramBotTelegramIdRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[TelegramBotTelegramIdResponse]:
    await enforce_bot_rate_limit("bot_telegram_id", data.user_id, limit=60, ttl=60)

    telegram_id = await bot_api.get_telegram_id_for_user_id(
        session=session,
        user_id=data.user_id,
    )
    return build_response(TelegramBotTelegramIdResponse(telegram_id=telegram_id))


@router.post(
    "/orders",
    response_model=SuccessListResponse[TelegramBotOrderSummary],
    dependencies=[Depends(verify_bot_secret)],
)
async def telegram_bot_orders(
    data: TelegramBotOrdersRequest,
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[TelegramBotOrderSummary]:
    await enforce_bot_rate_limit("bot_orders", data.telegram_id, limit=20, ttl=60)

    orders = await bot_api.get_active_orders_for_telegram_id(
        session=session,
        telegram_id=data.telegram_id,
        limit=3,
    )
    data_out = [
        TelegramBotOrderSummary(
            id=str(order.id),
            display_id=order.display_id,
            status=order.status,
            restaurant_name=order.restaurant.name if order.restaurant else None,
            total_price=order.total_price,
            created_at=order.created_at,
        )
        for order in orders
    ]
    return SuccessListResponse(
        data=data_out,
        pagination=Pagination(
            current_page=1,
            per_page=3,
            total=len(data_out),
            total_pages=1 if data_out else 0,
            next=None,
            previous=None,
        ),
    )
