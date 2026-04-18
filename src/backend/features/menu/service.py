import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu import crud
from features.menu.exceptions import MenuItemNotFoundException
from features.menu.schemas import MenuItemCreate, MenuItemResponse, MenuItemUpdate
from features.restaurants.dependencies import get_restaurant_and_check_ownership


async def add_menu_item(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_data: MenuItemCreate,
    vendor_id: uuid.UUID,
) -> MenuItemResponse:
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    item = await crud.create_menu_item(session, item_data, restaurant_id)
    return MenuItemResponse.model_validate(item)


async def get_menu(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    page: int = 1,
    size: int = 50,
) -> tuple[list[MenuItemResponse], int]:
    offset = (page - 1) * size
    data = await crud.get_menu_items(session, restaurant_id, offset=offset, limit=size)
    total = await crud.count_menu_items(session, restaurant_id)
    return [MenuItemResponse.model_validate(i) for i in data], total


async def _get_owned_menu_item(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> MenuItemResponse:
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    item = await crud.get_menu_item_by_id(session, item_id)
    if not item or item.restaurant_id != restaurant_id or item.is_deleted:
        raise MenuItemNotFoundException()
    return MenuItemResponse.model_validate(item)


async def update_menu_item_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    item_data: MenuItemUpdate,
    vendor_id: uuid.UUID,
) -> MenuItemResponse:
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    item = await crud.get_menu_item_by_id(session, item_id)
    if not item or item.restaurant_id != restaurant_id or item.is_deleted:
        raise MenuItemNotFoundException()
    updated = await crud.update_menu_item(session, item, item_data)
    return MenuItemResponse.model_validate(updated)


async def delete_menu_item_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> None:
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    item = await crud.get_menu_item_by_id(session, item_id)
    if not item or item.restaurant_id != restaurant_id or item.is_deleted:
        raise MenuItemNotFoundException()
    await crud.delete_menu_item(session, item)
