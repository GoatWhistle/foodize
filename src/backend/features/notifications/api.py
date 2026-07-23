import uuid
from http import HTTPStatus

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.notifications import crud, push_crud
from features.notifications.exceptions import NotificationNotFoundException
from features.notifications.push_schemas import (
    PushDeviceRegisterRequest,
    PushDeviceResponse,
)
from features.notifications.schemas import (
    NotificationListResponse,
    NotificationResponse,
)
from features.users.models import User
from settings.config.app_config import settings

router = APIRouter(
    prefix=settings.api.v1.notifications.prefix, tags=[settings.api.v1.notifications.tag]
)


@router.get("", response_model=NotificationListResponse)
async def get_my_notifications(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> NotificationListResponse:
    offset = (page - 1) * size
    items, total = await crud.get_user_notifications(session, user.id, limit=size, offset=offset)
    unread_count = await crud.get_unread_count(session, user.id)

    return NotificationListResponse(
        items=[NotificationResponse.model_validate(item) for item in items],
        total=total,
        unread_count=unread_count,
    )


@router.post("/{notification_id}/read", response_model=NotificationResponse)
async def read_notification(
    notification_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> NotificationResponse:
    notification = await crud.mark_as_read(session, notification_id, user.id)
    if not notification:
        raise NotificationNotFoundException()
    return NotificationResponse.model_validate(notification)


@router.post("/read-all", status_code=HTTPStatus.NO_CONTENT)
async def read_all_notifications(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await crud.mark_all_as_read(session, user.id)


@router.delete("/{notification_id}", status_code=HTTPStatus.NO_CONTENT)
async def delete_notification(
    notification_id: uuid.UUID,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    deleted = await crud.delete_notification(session, notification_id, user.id)
    if not deleted:
        raise NotificationNotFoundException()


@router.delete("", status_code=HTTPStatus.NO_CONTENT)
async def delete_all_notifications(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await crud.delete_all_notifications(session, user.id)


@router.post("/devices", response_model=PushDeviceResponse, status_code=HTTPStatus.CREATED)
async def register_device(
    payload: PushDeviceRegisterRequest,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> PushDeviceResponse:
    device = await push_crud.upsert_device(
        session,
        user_id=user.id,
        token=payload.token,
        platform=payload.platform.value,
        language=payload.language,
    )
    return PushDeviceResponse.model_validate(device)


@router.delete("/devices/{token}", status_code=HTTPStatus.NO_CONTENT)
async def unregister_device(
    token: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await push_crud.deactivate_device(session, user.id, token)
