import uuid

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.admin import crud
from features.admin.api.schemas import (
    BatchAffectedResult,
    BatchIdsRequest,
    SetPermissionsRequest,
)
from features.admin.audit_log import service as audit_service
from features.admin.dependencies import require_admin
from features.admin.schemas import AdminUserResponse
from features.admin.service import users as users_service
from features.users.models import User
from shared.permissions import ADMIN_PERMISSIONS, CUSTOMER_PERMISSIONS, serialize_permissions
from shared.response import build_list_response, build_response
from shared.schemas.response import SuccessListResponse, SuccessResponse

router = APIRouter()


@router.get("/users", response_model=SuccessListResponse[AdminUserResponse])
async def read_users(
    request: Request,
    role: str | None = Query(None),
    search: str | None = Query(None, max_length=128),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessListResponse[AdminUserResponse]:
    offset = (page - 1) * size
    data, total = await users_service.get_users_list(session, role, offset, size, search=search)
    return build_list_response(
        data=[AdminUserResponse.model_validate(user) for user in data],
        total=total,
        page=page,
        size=size,
        request=request,
    )


@router.post("/users/batch-deactivate", response_model=SuccessResponse[BatchAffectedResult])
async def batch_deactivate_users(
    body: BatchIdsRequest,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[BatchAffectedResult]:
    count = await crud.batch_deactivate_users(session, body.ids)
    await session.flush()
    return build_response(BatchAffectedResult(affected=count))


@router.post("/users/batch-activate", response_model=SuccessResponse[BatchAffectedResult])
async def batch_activate_users(
    body: BatchIdsRequest,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[BatchAffectedResult]:
    count = await crud.batch_activate_users(session, body.ids)
    await session.flush()
    return build_response(BatchAffectedResult(affected=count))


@router.get("/users/{user_id}", response_model=SuccessResponse[AdminUserResponse])
async def read_user(
    user_id: uuid.UUID,
    _: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await users_service.get_user_or_404(session, user_id)
    return build_response(AdminUserResponse.model_validate(result))


@router.delete("/users/{user_id}", response_model=SuccessResponse[AdminUserResponse])
async def delete_user(
    user_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await users_service.deactivate_user_service(session, user_id)
    await audit_service.log_action(session, actor.id, "DEACTIVATE_USER", "user", user_id)
    await session.flush()
    return build_response(AdminUserResponse.model_validate(result))


@router.post("/users/{user_id}/activate", response_model=SuccessResponse[AdminUserResponse])
async def activate_user(
    user_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await users_service.activate_user_service(session, user_id)
    await audit_service.log_action(session, actor.id, "ACTIVATE_USER", "user", user_id)
    await session.flush()
    return build_response(AdminUserResponse.model_validate(result))


@router.post("/users/{user_id}/grant-admin", response_model=SuccessResponse[AdminUserResponse])
async def grant_admin_permissions(
    user_id: uuid.UUID,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await users_service.set_user_permissions(
        session, user_id, serialize_permissions(ADMIN_PERMISSIONS), actor=actor
    )
    return build_response(AdminUserResponse.model_validate(result))


@router.post("/users/{user_id}/permissions", response_model=SuccessResponse[AdminUserResponse])
async def change_user_permissions(
    user_id: uuid.UUID,
    body: SetPermissionsRequest,
    actor: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await users_service.set_user_permissions(
        session, user_id, body.permissions, actor=actor
    )
    return build_response(AdminUserResponse.model_validate(result))


@router.post("/me/reset-permissions", response_model=SuccessResponse[AdminUserResponse])
async def reset_my_permissions(
    user: User = Depends(require_admin),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[AdminUserResponse]:
    result = await users_service.reset_own_permissions(
        session, user, serialize_permissions(CUSTOMER_PERMISSIONS)
    )
    return build_response(AdminUserResponse.model_validate(result))
