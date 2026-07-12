import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.users import crud
from features.users.dependencies import get_user_by_id_or_404
from features.users.models import User
from features.users.schemas import UserPublicRead, UserRead
from shared.enums.permissions import Permission
from shared.exceptions.existence import AuthException
from shared.exceptions.rules import AccessDeniedException
from shared.permissions import has_permission
from utils.jwt_tokens import validate_password


async def change_user_password(
    session: AsyncSession,
    current_user: User,
    old_password: str,
    new_password: str,
) -> None:
    if not current_user.hashed_password or not await validate_password(
        old_password, current_user.hashed_password
    ):
        raise AuthException(detail="Wrong password")
    await crud.update_user_password(session, current_user, new_password)


async def read_user_profile(
    session: AsyncSession,
    current_user: User,
    user_id: uuid.UUID,
) -> UserRead | UserPublicRead:
    is_self = current_user.id == user_id
    if not is_self and not has_permission(current_user.permissions, Permission.USERS_READ):
        raise AccessDeniedException()
    user = await get_user_by_id_or_404(session=session, user_id=user_id)
    if is_self:
        return UserRead.model_validate(user)
    return UserPublicRead.model_validate(user)
