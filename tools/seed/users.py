from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.users.crud import create_user, update_user
from features.users.models import User
from features.users.schemas import UserCreate, UserUpdate
from seed.fixtures.users import SEED_USERS
from shared.permissions import ADMIN_PERMISSIONS, serialize_permissions


async def seed_user(session: AsyncSession, u: dict[str, Any]) -> User:
    user = await create_user(
        session,
        UserCreate(
            name=u["name"],
            phone_number=u["phone_number"],
            password=u["password"],
        ),
    )
    await update_user(
        session,
        user,
        UserUpdate(
            first_name=u.get("first_name"),
            last_name=u.get("last_name"),
            middle_name=u.get("middle_name"),
            email=u.get("email"),
        ),
    )
    if u["role"] in ("admin", "superuser"):
        user.permissions = serialize_permissions(ADMIN_PERMISSIONS)
        await session.commit()
    return user


async def seed_users(session: AsyncSession) -> dict[str, User]:
    print("── Users ──────────────────────────────")
    created_users: dict[str, User] = {}
    for u in SEED_USERS:
        result = await session.execute(
            select(User).where(User.phone_number == u["phone_number"])
        )
        existing = result.scalar_one_or_none()
        if existing:
            print(f"  skip {u['phone_number']} (exists)")
            created_users[u["phone_number"]] = existing
            continue
        user = await seed_user(session, u)
        created_users[u["phone_number"]] = user
        print(f"  [{u['role']:8}] {u['name']}  {u['phone_number']}")
    return created_users
