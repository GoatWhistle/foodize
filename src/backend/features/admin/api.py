import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import service
from features.admin.dependencies import require_admin
from features.admin.schemas import AdminUserResponse, PlatformStats
from features.orders.schemas.order import OrderResponse
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

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
    data, total = await service.get_users_list(session, role, offset, size)
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/users/{user_id}", response_model=SuccessResponse[AdminUserResponse])
async def read_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.get_user_or_404(session, user_id)
    return build_response(result)


@router.delete("/users/{user_id}", response_model=SuccessResponse[AdminUserResponse])
async def delete_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.deactivate_user_service(session, user_id)
    return build_response(result)


@router.post("/users/{user_id}/activate", response_model=SuccessResponse[AdminUserResponse])
async def activate_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.activate_user_service(session, user_id)
    return build_response(result)


@router.post("/users/{user_id}/make-admin", response_model=SuccessResponse[AdminUserResponse])
async def promote_user_to_admin(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.set_user_role(session, user_id, UserRole.ADMIN)
    return build_response(result)


@router.post("/me/make-customer", response_model=SuccessResponse[AdminUserResponse])
async def demote_me_to_customer(
    user: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.set_user_role(session, user.id, UserRole.CUSTOMER)
    return build_response(result)


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
    data, total = await service.get_orders_list(
        session=session,
        status=status,
        restaurant_id=restaurant_id,
        user_id=user_id,
        offset=offset,
        limit=size,
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/stats", response_model=SuccessResponse[PlatformStats])
async def read_platform_stats(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[PlatformStats]:
    result = await service.get_stats(session)
    return build_response(result)
