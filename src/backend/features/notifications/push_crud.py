import uuid

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.push_models import PushDevice
from shared.crud import execute_rowcount


async def upsert_device(
    session: AsyncSession,
    user_id: uuid.UUID,
    token: str,
    platform: str,
    language: str | None = None,
) -> PushDevice:
    insert_stmt = pg_insert(PushDevice).values(
        user_id=user_id,
        token=token,
        platform=platform,
        language=language,
        is_active=True,
    )
    upsert_stmt = insert_stmt.on_conflict_do_update(
        index_elements=[PushDevice.token],
        set_={
            "user_id": user_id,
            "platform": platform,
            "language": language,
            "is_active": True,
        },
    ).returning(PushDevice)
    result = await session.execute(upsert_stmt)
    device: PushDevice = result.scalar_one()
    await session.flush()
    return device


async def deactivate_device(session: AsyncSession, user_id: uuid.UUID, token: str) -> bool:
    stmt = (
        update(PushDevice)
        .where(PushDevice.user_id == user_id, PushDevice.token == token)
        .values(is_active=False)
    )
    updated = await execute_rowcount(session, stmt)
    await session.flush()
    return updated > 0


async def get_active_devices_for_user(
    session: AsyncSession, user_id: uuid.UUID
) -> list[PushDevice]:
    stmt = select(PushDevice).where(PushDevice.user_id == user_id, PushDevice.is_active.is_(True))
    result = await session.execute(stmt)
    return list(result.scalars().all())
