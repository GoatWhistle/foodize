import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import ColumnElement, Select, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import json_array_contains_string
from features.users.models import User
from shared.crud import execute_rowcount
from shared.enums.permissions import Permission
from shared.enums.roles import UserRole


def _infer_role(permissions: list[str]) -> str:
    perm_set = set(permissions)
    if Permission.ADMIN_ACCESS.value in perm_set:
        return UserRole.ADMIN.value
    if Permission.RESTAURANTS_CREATE.value in perm_set:
        return UserRole.VENDOR.value
    if Permission.ORDERS_MANAGE_STATUS.value in perm_set:
        return UserRole.STAFF.value
    return UserRole.CUSTOMER.value


_ROLE_PERMISSION_MARKER: dict[str, str] = {
    UserRole.ADMIN.value: Permission.ADMIN_ACCESS.value,
    UserRole.VENDOR.value: Permission.RESTAURANTS_CREATE.value,
    UserRole.STAFF.value: Permission.ORDERS_MANAGE_STATUS.value,
}


def _apply_role_filter[RowT: tuple[object, ...]](stmt: Select[RowT], role: str) -> Select[RowT]:
    def _has_permission(perm: str) -> ColumnElement[bool]:
        return json_array_contains_string(User.permissions, perm)

    if role == UserRole.CUSTOMER.value:
        return stmt.where(
            ~_has_permission(Permission.ADMIN_ACCESS.value),
            ~_has_permission(Permission.RESTAURANTS_CREATE.value),
            ~_has_permission(Permission.ORDERS_MANAGE_STATUS.value),
        )
    marker = _ROLE_PERMISSION_MARKER.get(role)
    if marker:
        return stmt.where(_has_permission(marker))
    return stmt


async def get_all_users(
    session: AsyncSession,
    role: str | None = None,
    search: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    offset: int = 0,
    limit: int = 20,
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc())
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.name.ilike(pattern))
            | (User.phone_number.ilike(pattern))
            | (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
        )
    if role is not None:
        stmt = _apply_role_filter(stmt, role)
    if date_from is not None:
        stmt = stmt.where(
            User.created_at >= datetime.combine(date_from, datetime.min.time(), tzinfo=UTC)
        )
    if date_to is not None:
        stmt = stmt.where(
            User.created_at
            < datetime.combine(date_to + timedelta(days=1), datetime.min.time(), tzinfo=UTC)
        )
    result = await session.execute(stmt.offset(offset).limit(limit))
    return list(result.scalars().all())


async def count_all_users(
    session: AsyncSession,
    role: str | None = None,
    search: str | None = None,
) -> int:
    stmt = select(func.count()).select_from(User)
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            (User.name.ilike(pattern))
            | (User.phone_number.ilike(pattern))
            | (User.first_name.ilike(pattern))
            | (User.last_name.ilike(pattern))
        )
    if role is not None:
        stmt = _apply_role_filter(stmt, role)
    result = await session.execute(stmt)
    return result.scalar_one()


async def get_user_by_id(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def deactivate_user(session: AsyncSession, user: User) -> User:
    user.is_active = False
    await session.flush()
    await session.refresh(user)
    return user


async def activate_user(session: AsyncSession, user: User) -> User:
    user.is_active = True
    await session.flush()
    await session.refresh(user)
    return user


async def batch_deactivate_users(session: AsyncSession, ids: list[uuid.UUID]) -> int:
    return await execute_rowcount(
        session, update(User).where(User.id.in_(ids)).values(is_active=False)
    )


async def batch_activate_users(session: AsyncSession, ids: list[uuid.UUID]) -> int:
    return await execute_rowcount(
        session, update(User).where(User.id.in_(ids)).values(is_active=True)
    )
