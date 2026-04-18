import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin.crud import (
    count_all_orders,
    count_all_users,
    deactivate_user,
    get_all_orders,
    get_all_users,
    get_platform_stats,
    get_user_by_id,
)
from features.admin.dependencies import require_admin
from features.admin.schemas import AdminUserResponse, PlatformStats
from features.orders.schemas.order import OrderResponse
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole
from shared.exceptions import NotFoundException
from shared.response import build_list_response
from shared.schemas.response import SuccessListResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=SuccessListResponse[AdminUserResponse])
async def read_users(
    request: Request,
    role: UserRole | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[AdminUserResponse]:
    offset = (page - 1) * size
    data = await get_all_users(session, role=role, offset=offset, limit=size)
    total = await count_all_users(session, role=role)
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def read_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> AdminUserResponse:
    user = await get_user_by_id(session, user_id)
    if not user:
        raise NotFoundException()
    return user


@router.delete("/users/{user_id}", response_model=AdminUserResponse)
async def delete_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> AdminUserResponse:
    user = await get_user_by_id(session, user_id)
    if not user:
        raise NotFoundException()
    return await deactivate_user(session, user)


@router.get("/orders", response_model=SuccessListResponse[OrderResponse])
async def read_orders(
    request: Request,
    status: OrderStatus | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[OrderResponse]:
    offset = (page - 1) * size
    data = await get_all_orders(
        session,
        status=status,
        restaurant_id=restaurant_id,
        user_id=user_id,
        offset=offset,
        limit=size,
    )
    total = await count_all_orders(
        session,
        status=status,
        restaurant_id=restaurant_id,
        user_id=user_id,
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/stats", response_model=PlatformStats)
async def read_platform_stats(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> PlatformStats:
    return await get_platform_stats(session)
