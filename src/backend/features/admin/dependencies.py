from fastapi import Depends

from features.admin.exceptions import AdminAccessDeniedException
from features.auth.service import get_current_user
from features.users.models import User
from shared.enums.roles import UserRole


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.user_role != UserRole.ADMIN.value:
        raise AdminAccessDeniedException()
    return user
