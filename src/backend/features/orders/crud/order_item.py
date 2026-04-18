import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem


async def get_menu_items_by_ids(
    session: AsyncSession, ids: list[uuid.UUID]
) -> dict[uuid.UUID, MenuItem]:
    result = await session.execute(select(MenuItem).where(MenuItem.id.in_(ids)))
    return {mi.id: mi for mi in result.scalars().all()}
