import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import service
from features.admin.dependencies import require_admin
from features.admin.schemas import AdminUserResponse, PlatformStats
from features.auth.service import get_current_user
from features.orders.schemas.order import OrderResponse
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole
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
):
    offset = (page - 1) * size
    data, total = await service.get_users_list(session, role, offset, size)
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/users/{user_id}", response_model=AdminUserResponse)
async def read_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.get_user_or_404(session, user_id)


@router.delete("/users/{user_id}", response_model=AdminUserResponse)
async def delete_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.deactivate_user_service(session, user_id)


@router.post("/users/{user_id}/make-admin", response_model=AdminUserResponse)
@router.post("/me/make-admin", response_model=AdminUserResponse)
async def promote_me_to_admin(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.set_user_role(session, user.id, UserRole.ADMIN)


@router.post("/me/make-customer", response_model=AdminUserResponse)
async def demote_me_to_customer(
    user: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.set_user_role(session, user.id, UserRole.CUSTOMER)


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
):
    offset = (page - 1) * size
    data, total = await service.get_orders_list(
        session=session,
        status=status,
        restaurant_id=restaurant_id,
        user_id=user_id,
        offset=offset,
        limit=size,
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/stats", response_model=PlatformStats)
async def read_platform_stats(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    return await service.get_stats(session)
