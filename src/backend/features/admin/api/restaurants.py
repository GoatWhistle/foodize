import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin.api.schemas import (
    BatchIdsRequest,
    BatchModerationResult,
    BatchRejectRequest,
)
from features.admin.audit_log import service as audit_service
from features.admin.dependencies import require_admin
from features.admin.schemas import AdminRestaurantResponse, ModerationDecision
from features.admin.service import batch_moderation, catalog, moderation
from features.users.models import User
from shared.enums.moderation_status import ModerationStatus
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter()


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
    data, total = await catalog.get_restaurants_list(
        session,
        search=search,
        vendor_search=vendor_search,
        is_open=is_open,
        moderation_status=moderation_status,
        min_rating=min_rating,
        offset=offset,
        limit=size,
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.post("/restaurants/batch-approve", response_model=SuccessResponse[BatchModerationResult])
async def batch_approve_restaurants(
    body: BatchIdsRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[BatchModerationResult]:
    async def approve(db: AsyncSession, restaurant_id: uuid.UUID) -> object:
        return await moderation.moderate_restaurant(
            db, restaurant_id, ModerationStatus.APPROVED.value
        )

    result = await batch_moderation.run_batch_moderation(
        session, body.ids, actor.id, approve, "APPROVE_RESTAURANT", "restaurant"
    )
    return build_response(result)


@router.post("/restaurants/batch-reject", response_model=SuccessResponse[BatchModerationResult])
async def batch_reject_restaurants(
    body: BatchRejectRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[BatchModerationResult]:
    async def reject(db: AsyncSession, restaurant_id: uuid.UUID) -> object:
        return await moderation.moderate_restaurant(
            db, restaurant_id, ModerationStatus.REJECTED.value, body.reason
        )

    result = await batch_moderation.run_batch_moderation(
        session,
        body.ids,
        actor.id,
        reject,
        "REJECT_RESTAURANT",
        "restaurant",
        {"reason": body.reason},
    )
    return build_response(result)


@router.get("/restaurants/{restaurant_id}", response_model=SuccessResponse[AdminRestaurantResponse])
async def read_restaurant(
    restaurant_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await catalog.get_restaurant_or_404(session, restaurant_id)
    return build_response(result)


@router.delete(
    "/restaurants/{restaurant_id}", response_model=SuccessResponse[AdminRestaurantResponse]
)
async def delete_restaurant(
    restaurant_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await catalog.delete_restaurant_service(session, restaurant_id)
    await audit_service.log_action(
        session, actor.id, "DELETE_RESTAURANT", "restaurant", restaurant_id
    )
    await session.flush()
    return build_response(result)


@router.post(
    "/restaurants/{restaurant_id}/approve", response_model=SuccessResponse[AdminRestaurantResponse]
)
async def approve_restaurant(
    restaurant_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await moderation.moderate_restaurant(
        session, restaurant_id, ModerationStatus.APPROVED.value, actor_id=actor.id
    )
    return build_response(result)


@router.post(
    "/restaurants/{restaurant_id}/reject", response_model=SuccessResponse[AdminRestaurantResponse]
)
async def reject_restaurant(
    restaurant_id: uuid.UUID,
    body: ModerationDecision,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await moderation.moderate_restaurant(
        session, restaurant_id, ModerationStatus.REJECTED.value, body.reason, actor_id=actor.id
    )
    return build_response(result)
