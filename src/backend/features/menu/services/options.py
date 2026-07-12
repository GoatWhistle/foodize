import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu import crud
from features.menu.schemas import (
    MenuItemOptionCreate,
    MenuItemOptionGroupCreate,
    MenuItemOptionGroupResponse,
    MenuItemOptionGroupUpdate,
    MenuItemOptionResponse,
    MenuItemOptionUpdate,
)
from features.menu.services._shared import (
    get_owned_menu_item,
    get_owned_option,
    get_owned_option_group,
)
from shared.exceptions import BadRequestException


async def create_option_group_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    data: MenuItemOptionGroupCreate,
    vendor_id: uuid.UUID,
) -> MenuItemOptionGroupResponse:
    item = await get_owned_menu_item(session, restaurant_id, item_id, vendor_id)
    group = await crud.create_option_group(session, item, data)
    return MenuItemOptionGroupResponse.model_validate(group)


async def update_option_group_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    data: MenuItemOptionGroupUpdate,
    vendor_id: uuid.UUID,
) -> MenuItemOptionGroupResponse:
    group = await get_owned_option_group(session, restaurant_id, item_id, group_id, vendor_id)
    if (
        data.max_selected is not None
        and data.min_selected is not None
        and data.min_selected > data.max_selected
    ):
        raise BadRequestException(detail="min_selected cannot be greater than max_selected")
    updated = await crud.update_option_group(session, group, data)
    return MenuItemOptionGroupResponse.model_validate(updated)


async def delete_option_group_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> None:
    group = await get_owned_option_group(session, restaurant_id, item_id, group_id, vendor_id)
    await crud.delete_option_group(session, group)


async def create_option_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    data: MenuItemOptionCreate,
    vendor_id: uuid.UUID,
) -> MenuItemOptionResponse:
    group = await get_owned_option_group(session, restaurant_id, item_id, group_id, vendor_id)
    option = await crud.create_option(session, group, data)
    return MenuItemOptionResponse.model_validate(option)


async def update_option_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    option_id: uuid.UUID,
    data: MenuItemOptionUpdate,
    vendor_id: uuid.UUID,
) -> MenuItemOptionResponse:
    await get_owned_option_group(session, restaurant_id, item_id, group_id, vendor_id)
    option = await get_owned_option(session, group_id, option_id)
    updated = await crud.update_option(session, option, data)
    return MenuItemOptionResponse.model_validate(updated)


async def delete_option_for_vendor(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_id: uuid.UUID,
    group_id: uuid.UUID,
    option_id: uuid.UUID,
    vendor_id: uuid.UUID,
) -> None:
    await get_owned_option_group(session, restaurant_id, item_id, group_id, vendor_id)
    option = await get_owned_option(session, group_id, option_id)
    await crud.delete_option(session, option)
