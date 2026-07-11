from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.users.models import User


async def get_or_load_user(
    session: AsyncSession, phone: str, created_users: dict[str, User]
) -> User | None:
    user = created_users.get(phone)
    if user is None:
        result = await session.execute(select(User).where(User.phone_number == phone))
        user = result.scalar_one_or_none()
    return user
