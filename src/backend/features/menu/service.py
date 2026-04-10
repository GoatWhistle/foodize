import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import create_menu_item_in_db, get_menu_items_from_db
from features.menu.schemas import MenuItemCreate
from features.restaurants.dependencies import get_restaurant_and_check_ownership


async def add_item_to_menu_logic(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    item_data: MenuItemCreate,
    vendor_id: uuid.UUID,
):
    await get_restaurant_and_check_ownership(
        session=session, restaurant_id=restaurant_id, vendor_id=vendor_id
    )
    return await create_menu_item_in_db(session, item_data, restaurant_id)


async def get_restaurant_menu_logic(session: AsyncSession, restaurant_id: uuid.UUID):
    return await get_menu_items_from_db(session, restaurant_id)
