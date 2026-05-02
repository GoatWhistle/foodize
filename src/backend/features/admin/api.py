import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import service
from features.admin.dependencies import require_admin
from features.admin.schemas import (
    AdminRestaurantResponse,
    AdminReviewResponse,
    AdminUserResponse,
    AdminVendorResponse,
    AdvancedAnalytics,
    FinanceAnalytics,
    ModerationDecision,
    PlatformStats,
)
from features.orders.schemas.order import OrderResponse
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse


class SetRoleRequest(BaseModel):
    role: UserRole


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/users", response_model=SuccessListResponse[AdminUserResponse])
async def read_users(
    request: Request,
    role: UserRole | None = Query(None),
    search: str | None = Query(None, max_length=128),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[AdminUserResponse]:
    offset = (page - 1) * size
    data, total = await service.get_users_list(
        session, role, offset, size, search=search
    )
    return build_list_response(
        data=data, total=total, page=page, size=size, request=request
    )


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


@router.post(
    "/users/{user_id}/activate", response_model=SuccessResponse[AdminUserResponse]
)
async def activate_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.activate_user_service(session, user_id)
    return build_response(result)


@router.post(
    "/users/{user_id}/make-admin", response_model=SuccessResponse[AdminUserResponse]
)
async def promote_user_to_admin(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.set_user_role(session, user_id, UserRole.ADMIN)
    return build_response(result)


@router.post("/users/{user_id}/role", response_model=SuccessResponse[AdminUserResponse])
async def change_user_role(
    user_id: uuid.UUID,
    body: SetRoleRequest,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await service.set_user_role(session, user_id, body.role)
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
    search: str | None = Query(None, max_length=128),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
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
        search=search,
        date_from=date_from,
        date_to=date_to,
        offset=offset,
        limit=size,
    )
    return build_list_response(
        data=data, total=total, page=page, size=size, request=request
    )


@router.get("/restaurants", response_model=SuccessListResponse[AdminRestaurantResponse])
async def read_restaurants(
    request: Request,
    search: str | None = Query(None, max_length=128),
    vendor_search: str | None = Query(None, max_length=128),
    is_open: bool | None = Query(None),
    moderation_status: str | None = Query(None),
    min_rating: float | None = Query(None, ge=1, le=5),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[AdminRestaurantResponse]:
    offset = (page - 1) * size
    data, total = await service.get_restaurants_list(
        session,
        search=search,
        vendor_search=vendor_search,
        is_open=is_open,
        moderation_status=moderation_status,
        min_rating=min_rating,
        offset=offset,
        limit=size,
    )
    return build_list_response(
        data=data, total=total, page=page, size=size, request=request
    )


@router.get(
    "/restaurants/{restaurant_id}",
    response_model=SuccessResponse[AdminRestaurantResponse],
)
async def read_restaurant(
    restaurant_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.get_restaurant_or_404(session, restaurant_id)
    return build_response(result)


@router.delete(
    "/restaurants/{restaurant_id}",
    response_model=SuccessResponse[AdminRestaurantResponse],
)
async def delete_restaurant(
    restaurant_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.delete_restaurant_service(session, restaurant_id)
    return build_response(result)


@router.post(
    "/restaurants/{restaurant_id}/approve",
    response_model=SuccessResponse[AdminRestaurantResponse],
)
async def approve_restaurant(
    restaurant_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.moderate_restaurant(session, restaurant_id, "APPROVED")
    return build_response(result)


@router.post(
    "/restaurants/{restaurant_id}/reject",
    response_model=SuccessResponse[AdminRestaurantResponse],
)
async def reject_restaurant(
    restaurant_id: uuid.UUID,
    body: ModerationDecision,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.moderate_restaurant(
        session, restaurant_id, "REJECTED", body.reason
    )
    return build_response(result)


@router.get("/vendors", response_model=SuccessListResponse[AdminVendorResponse])
async def read_vendors(
    request: Request,
    search: str | None = Query(None, max_length=128),
    approval_status: str | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[AdminVendorResponse]:
    offset = (page - 1) * size
    data, total = await service.get_vendors_list(
        session,
        search=search,
        approval_status=approval_status,
        offset=offset,
        limit=size,
    )
    return build_list_response(
        data=data, total=total, page=page, size=size, request=request
    )


@router.get("/vendors/{vendor_id}", response_model=SuccessResponse[AdminVendorResponse])
async def read_vendor(
    vendor_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await service.get_vendor_or_404(session, vendor_id)
    return build_response(result)


@router.delete(
    "/vendors/{vendor_id}", response_model=SuccessResponse[AdminVendorResponse]
)
async def delete_vendor(
    vendor_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await service.delete_vendor_service(session, vendor_id)
    return build_response(result)


@router.post(
    "/vendors/{vendor_id}/approve", response_model=SuccessResponse[AdminVendorResponse]
)
async def approve_vendor(
    vendor_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await service.moderate_vendor(session, vendor_id, "APPROVED")
    return build_response(result)


@router.post(
    "/vendors/{vendor_id}/reject", response_model=SuccessResponse[AdminVendorResponse]
)
async def reject_vendor(
    vendor_id: uuid.UUID,
    body: ModerationDecision,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await service.moderate_vendor(session, vendor_id, "REJECTED", body.reason)
    return build_response(result)


@router.get("/reviews", response_model=SuccessListResponse[AdminReviewResponse])
async def read_reviews(
    request: Request,
    rating: int | None = Query(None, ge=1, le=5),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[AdminReviewResponse]:
    offset = (page - 1) * size
    data, total = await service.get_reviews_list(
        session,
        rating=rating,
        offset=offset,
        limit=size,
    )
    return build_list_response(
        data=data, total=total, page=page, size=size, request=request
    )


@router.delete(
    "/reviews/{review_id}", response_model=SuccessResponse[AdminReviewResponse]
)
async def delete_review(
    review_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminReviewResponse]:
    result = await service.delete_review_service(session, review_id)
    return build_response(result)


@router.get("/stats", response_model=SuccessResponse[PlatformStats])
async def read_platform_stats(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[PlatformStats]:
    result = await service.get_stats(session)
    return build_response(result)


@router.get("/finance", response_model=SuccessResponse[FinanceAnalytics])
async def read_finance(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[FinanceAnalytics]:
    result = await service.get_finance(
        session, date_from=date_from, date_to=date_to, restaurant_id=restaurant_id
    )
    return build_response(result)


@router.get("/analytics", response_model=SuccessResponse[AdvancedAnalytics])
async def read_advanced_analytics(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdvancedAnalytics]:
    result = await service.get_advanced_analytics(
        session, date_from=date_from, date_to=date_to, restaurant_id=restaurant_id
    )
    return build_response(result)
