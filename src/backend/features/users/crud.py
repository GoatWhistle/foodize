from sqlalchemy.ext.asyncio import AsyncSession

from features import User
from features.users.schemas import UserCreate


async def create_user(session: AsyncSession, user_in: UserCreate):
    db_user = User(**user_in.model_dump())
    session.add(db_user)
    await session.commit()
    return db_user
