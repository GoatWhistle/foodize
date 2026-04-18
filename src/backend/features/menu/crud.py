import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate, MenuItemUpdate


async def create_menu_item(
    session: AsyncSession, item_data: MenuItemCreate, restaurant_id: uuid.UUID
) -> MenuItem:
    new_item = MenuItem(**item_data.model_dump(), restaurant_id=restaurant_id)
    session.add(new_item)
    await session.commit()
    await session.refresh(new_item)
    return new_item


async def get_menu_item_by_id(session: AsyncSession, item_id: uuid.UUID) -> MenuItem | None:
    return await session.get(MenuItem, item_id)


async def get_menu_items(session: AsyncSession, restaurant_id: uuid.UUID) -> list[MenuItem]:
    result = await session.execute(
        select(MenuItem).where(
            MenuItem.restaurant_id == restaurant_id,
            not MenuItem.is_deleted,
        )
    )
    return list(result.scalars().all())


async def update_menu_item(
    session: AsyncSession, item: MenuItem, item_data: MenuItemUpdate
) -> MenuItem:
    for key, value in item_data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    await session.commit()
    await session.refresh(item)
    return item


async def delete_menu_item(session: AsyncSession, item: MenuItem) -> None:
    item.is_deleted = True
    await session.commit()
