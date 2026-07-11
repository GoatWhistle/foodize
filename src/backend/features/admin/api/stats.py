import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import crud
from features.admin.dependencies import require_admin
from features.admin.schemas import AdvancedAnalytics, FinanceAnalytics, PlatformStats
from features.admin.service import analytics, catalog
from features.orders.schemas.order import OrderResponse
from features.users.models import User
from shared.enums.order_status import OrderStatus
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter()


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
    data, total = await catalog.get_orders_list(
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
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.get("/stats", response_model=SuccessResponse[PlatformStats])
async def read_platform_stats(
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[PlatformStats]:
    result = await analytics.get_stats(session)
    return build_response(result)


@router.get("/finance", response_model=SuccessResponse[FinanceAnalytics])
async def read_finance(
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    restaurant_id: uuid.UUID | None = Query(None),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[FinanceAnalytics]:
    result = await analytics.get_finance(
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
    result = await analytics.get_advanced_analytics(
        session, date_from=date_from, date_to=date_to, restaurant_id=restaurant_id
    )
    return build_response(result)


@router.get("/audit-logs")
async def get_audit_logs(
    request: Request,
    action: str | None = Query(None),
    entity_type: str | None = Query(None),
    actor_id: uuid.UUID | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=200),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
):
    rows, total = await crud.get_audit_logs(
        session,
        action=action,
        entity_type=entity_type,
        actor_id=actor_id,
        date_from=date_from,
        date_to=date_to,
        offset=(page - 1) * size,
        limit=size,
    )
    data = [
        {
            "id": str(r.id),
            "actor_id": str(r.actor_id) if r.actor_id else None,
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": str(r.entity_id) if r.entity_id else None,
            "details": r.details,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
    return build_list_response(data=data, total=total, page=page, size=size, request=request)
