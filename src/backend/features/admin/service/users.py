import uuid
from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.audit_log import service as audit_service
from features.admin.exceptions import PermissionAssignmentDeniedException
from features.users.models import User
from shared.enums.permissions import Permission
from shared.exceptions import NotFoundException
from shared.permissions import (
    has_explicit_permission,
    normalize_permissions,
    serialize_permissions,
)


async def get_users_list(
    session: AsyncSession,
    role: str | None,
    offset: int,
    limit: int,
    search: str | None = None,
) -> tuple[list[User], int]:
    data = await crud.get_all_users(session, role=role, search=search, offset=offset, limit=limit)
    total = await crud.count_all_users(session, role=role, search=search)
    return data, total


async def get_user_or_404(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await crud.get_user_by_id(session, user_id)
    if not user:
        raise NotFoundException()
    return user


async def deactivate_user_service(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await get_user_or_404(session, user_id)
    return await crud.deactivate_user(session, user)


async def activate_user_service(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await get_user_or_404(session, user_id)
    return await crud.activate_user(session, user)


async def _write_user_permissions(
    session: AsyncSession,
    user_id: uuid.UUID,
    permissions: Sequence[Permission | str],
    actor_id: uuid.UUID | None,
) -> User:
    user = await get_user_or_404(session, user_id)
    old_permissions = user.permissions
    user.permissions = serialize_permissions(permissions)
    await session.flush()

    await audit_service.log_action(
        session,
        actor_id=actor_id,
        action="UPDATE_PERMISSIONS",
        entity_type="user",
        entity_id=user.id,
        details={"old": old_permissions, "new": user.permissions},
    )
    return user


async def set_user_permissions(
    session: AsyncSession,
    user_id: uuid.UUID,
    permissions: Sequence[Permission | str],
    actor: User,
) -> User:
    if not has_explicit_permission(actor.permissions, Permission.USERS_ASSIGN_PERMISSIONS):
        raise PermissionAssignmentDeniedException()
    if actor.id == user_id:
        raise PermissionAssignmentDeniedException()

    requested = normalize_permissions(permissions)
    actor_permissions = normalize_permissions(actor.permissions)
    if not requested <= actor_permissions:
        raise PermissionAssignmentDeniedException()

    return await _write_user_permissions(session, user_id, permissions, actor.id)


async def reset_own_permissions(
    session: AsyncSession,
    user: User,
    permissions: Sequence[Permission | str],
) -> User:
    return await _write_user_permissions(session, user.id, permissions, user.id)
