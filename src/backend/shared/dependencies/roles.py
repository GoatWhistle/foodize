from typing import Sequence

from fastapi import Depends

from features.auth.service import get_current_user
from features.users.models import User
from shared.enums.roles import UserRole
from shared.exceptions.rules import RuleException


class RoleChecker:
    def __init__(self, allowed_roles: Sequence[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)) -> User:
        if user.user_role not in {r.value for r in self.allowed_roles}:
            raise RuleException(
                detail="Insufficient permissions to perform this action"
            )
        return user
