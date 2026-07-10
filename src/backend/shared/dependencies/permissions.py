from collections.abc import Sequence

from fastapi import Depends

from features.auth.service import get_current_user
from features.users.models import User
from shared.enums.permissions import Permission
from shared.exceptions.rules import AccessDeniedException
from shared.permissions import has_permission
from utils.logging_setup import get_logger

logger = get_logger(__name__)


class PermissionChecker:
    def __init__(self, required_permissions: Sequence[Permission]):
        self.required_permissions = tuple(required_permissions)

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        missing_permissions = [
            permission
            for permission in self.required_permissions
            if not has_permission(user.permissions, permission)
        ]
        if missing_permissions:
            logger.warning(
                "permission_denied",
                user_id=str(user.id),
                missing=[permission.value for permission in missing_permissions],
            )
            raise AccessDeniedException()
        return user


def require_permission(*permissions: Permission) -> PermissionChecker:
    return PermissionChecker(required_permissions=permissions)
