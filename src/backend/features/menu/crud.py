import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.models import MenuItem
from features.menu.schemas import MenuItemCreate, MenuItemUpdate


async def create_menu_item(
    session: AsyncSession, item_data: MenuItemCreate, restaurant_id: uuid.UUID
) -> MenuItem:
    data = item_data.model_dump()
    if "category" in data and hasattr(data["category"], "value"):
        data["category"] = data["category"].value

    new_item = MenuItem(**data, restaurant_id=restaurant_id)
    session.add(new_item)
    await session.commit()
    await session.refresh(new_item)
    return new_item


async def get_menu_item_by_id(session: AsyncSession, item_id: uuid.UUID) -> MenuItem | None:
    return await session.get(MenuItem, item_id)


async def get_menu_items(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    offset: int = 0,
    limit: int = 50,
) -> list[MenuItem]:
    result = await session.execute(
        select(MenuItem)
        .where(
            MenuItem.restaurant_id == restaurant_id,
            MenuItem.is_deleted == False,  # noqa: E712
        )
        .offset(offset)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_menu_items(session: AsyncSession, restaurant_id: uuid.UUID) -> int:
    result = await session.execute(
        select(func.count())
        .select_from(MenuItem)
        .where(
            MenuItem.restaurant_id == restaurant_id,
            MenuItem.is_deleted == False,  # noqa: E712
        )
    )
    return result.scalar_one()


async def update_menu_item(
    session: AsyncSession, item: MenuItem, item_data: MenuItemUpdate
) -> MenuItem:
    update_data = item_data.model_dump(exclude_unset=True)
    if "category" in update_data and update_data["category"] is not None:
        if hasattr(update_data["category"], "value"):
            update_data["category"] = update_data["category"].value

    for key, value in update_data.items():
        setattr(item, key, value)
    await session.commit()
    await session.refresh(item)
    return item


async def delete_menu_item(session: AsyncSession, item: MenuItem) -> None:
    item.is_deleted = True
    await session.commit()
