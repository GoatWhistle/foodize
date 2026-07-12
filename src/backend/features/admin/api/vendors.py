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
from features.admin.schemas import AdminVendorResponse, ModerationDecision
from features.admin.service import batch_moderation, catalog, moderation
from features.users.models import User
from shared.enums.moderation_status import ModerationStatus
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter()


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
    data, total = await catalog.get_vendors_list(
        session,
        search=search,
        approval_status=approval_status,
        offset=offset,
        limit=size,
    )
    return build_list_response(data=data, total=total, page=page, size=size, request=request)


@router.post("/vendors/batch-approve", response_model=SuccessResponse[BatchModerationResult])
async def batch_approve_vendors(
    body: BatchIdsRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[BatchModerationResult]:
    async def approve(db: AsyncSession, vendor_id: uuid.UUID) -> object:
        return await moderation.moderate_vendor(db, vendor_id, ModerationStatus.APPROVED.value)

    result = await batch_moderation.run_batch_moderation(
        session, body.ids, actor.id, approve, "APPROVE_VENDOR", "vendor"
    )
    return build_response(result)


@router.post("/vendors/batch-reject", response_model=SuccessResponse[BatchModerationResult])
async def batch_reject_vendors(
    body: BatchRejectRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[BatchModerationResult]:
    async def reject(db: AsyncSession, vendor_id: uuid.UUID) -> object:
        return await moderation.moderate_vendor(
            db, vendor_id, ModerationStatus.REJECTED.value, body.reason
        )

    result = await batch_moderation.run_batch_moderation(
        session, body.ids, actor.id, reject, "REJECT_VENDOR", "vendor", {"reason": body.reason}
    )
    return build_response(result)


@router.get("/vendors/{vendor_id}", response_model=SuccessResponse[AdminVendorResponse])
async def read_vendor(
    vendor_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await catalog.get_vendor_or_404(session, vendor_id)
    return build_response(result)


@router.delete("/vendors/{vendor_id}", response_model=SuccessResponse[AdminVendorResponse])
async def delete_vendor(
    vendor_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await catalog.delete_vendor_service(session, vendor_id)
    await audit_service.log_action(session, actor.id, "DEACTIVATE_VENDOR", "vendor", vendor_id)
    await session.flush()
    return build_response(result)


@router.post("/vendors/{vendor_id}/approve", response_model=SuccessResponse[AdminVendorResponse])
async def approve_vendor(
    vendor_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await moderation.moderate_vendor(
        session, vendor_id, ModerationStatus.APPROVED.value, actor_id=actor.id
    )
    return build_response(result)


@router.post("/vendors/{vendor_id}/reject", response_model=SuccessResponse[AdminVendorResponse])
async def reject_vendor(
    vendor_id: uuid.UUID,
    body: ModerationDecision,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminVendorResponse]:
    result = await moderation.moderate_vendor(
        session, vendor_id, ModerationStatus.REJECTED.value, body.reason, actor_id=actor.id
    )
    return build_response(result)
