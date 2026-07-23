import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import crud
from features.admin.api.schemas import BatchAffectedResult, BatchIdsRequest
from features.admin.audit_log import service as audit_service
from features.admin.dependencies import require_admin
from features.admin.schemas import AdminReviewResponse
from features.admin.service import catalog
from features.users.models import User
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter()


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
    data, total = await catalog.get_reviews_list(session, rating=rating, offset=offset, limit=size)
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.delete("/reviews/batch", response_model=SuccessResponse[BatchAffectedResult])
async def batch_delete_reviews(
    body: BatchIdsRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[BatchAffectedResult]:
    count = await crud.batch_delete_reviews(session, body.ids)
    for rid in body.ids:
        await audit_service.log_action(session, actor.id, "DELETE_REVIEW", "review", rid)
    await session.flush()
    return build_response(BatchAffectedResult(affected=count))


@router.delete("/reviews/{review_id}", response_model=SuccessResponse[AdminReviewResponse])
async def delete_review(
    review_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminReviewResponse]:
    result = await catalog.delete_review_service(session, review_id)
    await audit_service.log_action(session, actor.id, "DELETE_REVIEW", "review", review_id)
    await session.flush()
    return build_response(result)
