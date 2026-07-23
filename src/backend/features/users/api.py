import uuid
from http import HTTPStatus

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper
from features.auth.service import get_current_user
from features.users import crud
from features.users import service as users_service
from features.users.models import User
from features.users.schemas import ChangePasswordRequest, UserPublicRead, UserRead, UserUpdate
from middlewares.limiter import limiter
from settings.config.app_config import settings
from shared.response import build_response
from shared.schemas.response import SuccessResponse

router = APIRouter(prefix=settings.api.v1.users.prefix, tags=[settings.api.v1.users.tag])


@router.get("/me", response_model=SuccessResponse[UserRead])
async def read_my_profile(
    current_user: User = Depends(get_current_user),
) -> SuccessResponse[UserRead]:
    return build_response(UserRead.model_validate(current_user))


@router.patch("/me", response_model=SuccessResponse[UserRead])
async def update_my_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead]:
    updated = await crud.update_user(session, current_user, data)
    return build_response(UserRead.model_validate(updated))


@router.post("/me/change-password", status_code=HTTPStatus.NO_CONTENT)
@limiter.limit("5/minute")
async def change_my_password(
    request: Request,
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> None:
    await users_service.change_user_password(
        session, current_user, data.old_password, data.new_password
    )


@router.get(
    "/{user_id}",
    response_model=SuccessResponse[UserRead | UserPublicRead],
)
async def read_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(db_helper.dependency_session_getter),
) -> SuccessResponse[UserRead | UserPublicRead]:
    profile = await users_service.read_user_profile(session, current_user, user_id)
    return build_response(profile)
