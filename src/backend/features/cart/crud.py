import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem


async def get_menu_items_by_ids(db: AsyncSession, item_ids: list[uuid.UUID]):
    if not item_ids:
        return []
    query = select(MenuItem).where(MenuItem.id.in_(item_ids))
    result = await db.execute(query)
    return result.scalars().all()
