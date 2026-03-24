from sqlalchemy.ext.asyncio import AsyncSession

from features.users.schemas import UserCreate
from features.users import crud


async def register_new_user(session: AsyncSession, user_in: UserCreate):
    new_user = await crud.create_user(session, user_in)
    return new_user
