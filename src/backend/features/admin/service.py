import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.users.models import User
from shared.enums.roles import UserRole
from shared.exceptions import NotFoundException


async def get_users_list(session: AsyncSession, role: UserRole | None, offset: int, limit: int):
    data = await crud.get_all_users(session, role=role, offset=offset, limit=limit)
    total = await crud.count_all_users(session, role=role)
    return data, total


async def get_user_or_404(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await crud.get_user_by_id(session, user_id)
    if not user:
        raise NotFoundException()
    return user


async def deactivate_user_service(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await get_user_or_404(session, user_id)
    return await crud.deactivate_user(session, user)


async def set_user_role(session: AsyncSession, user_id: uuid.UUID, role: UserRole) -> User:
    user = await get_user_or_404(session, user_id)
    user.user_role = role.value
    await session.commit()
    await session.refresh(user)
    return user


async def get_orders_list(session: AsyncSession, **kwargs):
    data = await crud.get_all_orders(session, **kwargs)
    total = await crud.count_all_orders(
        session,
        status=kwargs.get("status"),
        restaurant_id=kwargs.get("restaurant_id"),
        user_id=kwargs.get("user_id"),
    )
    return data, total


async def get_stats(session: AsyncSession) -> dict:
    return await crud.get_platform_stats(session)
