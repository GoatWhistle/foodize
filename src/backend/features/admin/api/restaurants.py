import logging
import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import service
from features.admin.audit_log import service as audit_service
from features.admin.dependencies import require_admin
from features.admin.schemas import AdminRestaurantResponse, ModerationDecision
from features.admin.api.schemas import BatchIdsRequest, BatchRejectRequest
from features.users.models import User
from shared.enums.moderation_status import ModerationStatus
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

logger = logging.getLogger(__name__)

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
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.post("/restaurants/batch-approve")
async def batch_approve_restaurants(
    body: BatchIdsRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[dict]:
    approved, failed = [], []
    for rid in body.ids:
        try:
            async with session.begin_nested():
                await service.moderate_restaurant(session, rid, ModerationStatus.APPROVED.value)
                await audit_service.log_action(session, actor.id, "APPROVE_RESTAURANT", "restaurant", rid)
            approved.append(str(rid))
        except Exception as exc:
            logger.exception("batch_approve_restaurants failed for id=%s", rid)
            failed.append({"id": str(rid), "error": str(exc)})
    await session.commit()
    return build_response({"approved": approved, "failed": failed})


@router.post("/restaurants/batch-reject")
async def batch_reject_restaurants(
    body: BatchRejectRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[dict]:
    rejected, failed = [], []
    for rid in body.ids:
        try:
            async with session.begin_nested():
                await service.moderate_restaurant(
                    session, rid, ModerationStatus.REJECTED.value, body.reason
                )
                await audit_service.log_action(
                    session, actor.id, "REJECT_RESTAURANT", "restaurant", rid, {"reason": body.reason}
                )
            rejected.append(str(rid))
        except Exception as exc:
            logger.exception("batch_reject_restaurants failed for id=%s", rid)
            failed.append({"id": str(rid), "error": str(exc)})
    await session.commit()
    return build_response({"rejected": rejected, "failed": failed})


@router.get("/restaurants/{restaurant_id}", response_model=SuccessResponse[AdminRestaurantResponse])
async def read_restaurant(
    restaurant_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.get_restaurant_or_404(session, restaurant_id)
    return build_response(result)


@router.delete("/restaurants/{restaurant_id}", response_model=SuccessResponse[AdminRestaurantResponse])
async def delete_restaurant(
    restaurant_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.delete_restaurant_service(session, restaurant_id)
    await audit_service.log_action(session, actor.id, "DELETE_RESTAURANT", "restaurant", restaurant_id)
    await session.commit()
    return build_response(result)


@router.post("/restaurants/{restaurant_id}/approve", response_model=SuccessResponse[AdminRestaurantResponse])
async def approve_restaurant(
    restaurant_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.moderate_restaurant(
        session, restaurant_id, ModerationStatus.APPROVED.value, actor_id=actor.id
    )
    return build_response(result)


@router.post("/restaurants/{restaurant_id}/reject", response_model=SuccessResponse[AdminRestaurantResponse])
async def reject_restaurant(
    restaurant_id: uuid.UUID,
    body: ModerationDecision,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminRestaurantResponse]:
    result = await service.moderate_restaurant(
        session, restaurant_id, ModerationStatus.REJECTED.value, body.reason, actor_id=actor.id
    )
    return build_response(result)
