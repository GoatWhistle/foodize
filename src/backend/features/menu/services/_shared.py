import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu import crud
from features.menu.exceptions import MenuItemNotFoundException
from features.menu.models import MenuItem, MenuItemOption, MenuItemOptionGroup
from features.restaurants.dependencies import get_restaurant_and_check_ownership
from shared.exceptions import NotFoundException


async def get_owned_menu_item(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> MenuItem:
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    item = await crud.get_menu_item_by_id(session, item_id)
    if not item or item.restaurant_id != restaurant_id or item.is_deleted:
        raise MenuItemNotFoundException()
    return item


async def get_owned_option_group(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> MenuItemOptionGroup:
    await get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    group = await crud.get_option_group_by_id(session, group_id)
    if not group or group.menu_item_id != item_id:
        raise NotFoundException(detail="Option group not found")
    return group


async def get_owned_option(
    session: AsyncSession,
    group_id: uuid.UUID,
    option_id: uuid.UUID,
) -> MenuItemOption:
    option = await crud.get_option_by_id(session, option_id)
    if not option or option.group_id != group_id:
        raise NotFoundException(detail="Option not found")
    return option
