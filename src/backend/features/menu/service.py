import uuid
from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession

if TYPE_CHECKING:
    from features.menu.models import MenuItem

from features.menu.crud import (
    create_menu_item,
    delete_menu_item,
    get_menu_item_by_id,
    get_menu_items,
    update_menu_item,
)
from features.menu.exceptions import MenuItemNotFoundException
from features.menu.schemas import MenuItemCreate, MenuItemUpdate
from features.restaurants.dependencies import get_restaurant_and_check_ownership


async def add_menu_item(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_data: MenuItemCreate,
    vendor_id: uuid.UUID,
) -> "MenuItem":
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    return await create_menu_item(session, item_data, restaurant_id)


async def get_menu(session: AsyncSession, restaurant_id: uuid.UUID) -> list["MenuItem"]:
    return await get_menu_items(session, restaurant_id)


async def _get_owned_menu_item(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> "MenuItem":
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    item = await get_menu_item_by_id(session, item_id)
    if not item or item.restaurant_id != restaurant_id or item.is_deleted:
        raise MenuItemNotFoundException()
    return item


async def update_menu_item_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    item_data: MenuItemUpdate,
    vendor_id: uuid.UUID,
) -> "MenuItem":
    item = await _get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    return await update_menu_item(session, item, item_data)


async def delete_menu_item_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> None:
    item = await _get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    await delete_menu_item(session, item)
