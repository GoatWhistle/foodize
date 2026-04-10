import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features import MenuItem
from features.menu.schemas import MenuItemCreate


async def create_menu_item_in_db(
    session: AsyncSession, item_data: MenuItemCreate, restaurant_id: uuid.UUID
) -> MenuItem:
    new_item = MenuItem(**item_data.model_dump(), restaurant_id=restaurant_id)
    session.add(new_item)
    await session.commit()
    await session.refresh(new_item)
    return new_item


async def get_menu_items_from_db(session: AsyncSession, restaurant_id: uuid.UUID) -> list[MenuItem]:
    stmt = select(MenuItem).where(MenuItem.restaurant_id == restaurant_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())
