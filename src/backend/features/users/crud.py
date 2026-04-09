from sqlalchemy.ext.asyncio import AsyncSession
from features import User
from features.users.schemas import UserCreate
from utils.JWT import hash_password
async def create_user(
    session: AsyncSession,
    user_in: UserCreate,
) -> User:
    user_data = user_in.model_dump(exclude={"password", "user_role"})
    db_user = User(
        **user_data,
        user_role=user_in.user_role.value,
        hashed_password=hash_password(user_in.password),
    )
    session.add(db_user)
    await session.commit()
    await session.flush()
    return db_user
