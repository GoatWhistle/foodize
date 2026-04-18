import pytest

from features.menu.crud import (
    count_menu_items,
    create_menu_item,
    delete_menu_item,
    get_menu_item_by_id,
    get_menu_items,
    update_menu_item,
)
from features.menu.schemas import MenuItemCreate, MenuItemUpdate
from features.restaurants.crud import create_restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.category import Category
from shared.enums.roles import UserRole


@pytest.fixture
async def restaurant(db_session):
    vendor_data = UserCreate(
        name="Vendor3",
        phone_number="79006666666",
        password="strongpassword",
        user_role=UserRole.VENDOR,
    )
    vendor_user = await create_user(db_session, vendor_data)
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())
    rest_data = RestaurantCreate(name="Rest3", address="Addr3")
    return await create_restaurant(db_session, rest_data, vendor_profile.id)


@pytest.mark.asyncio
async def test_create_and_get_menu_item(db_session, restaurant):
    item_create = MenuItemCreate(
        name="Sushi", description="Fish", price=800, category=Category.SHAURMA
    )

    new_item = await create_menu_item(db_session, item_create, restaurant.id)
    assert new_item.id is not None
    assert new_item.name == "Sushi"
    assert new_item.price == 800
    assert not new_item.is_deleted

    fetched = await get_menu_item_by_id(db_session, new_item.id)
    assert fetched is not None
    assert fetched.id == new_item.id

    items = await get_menu_items(db_session, restaurant.id)
    assert len(items) == 1
    assert items[0].name == "Sushi"

    count = await count_menu_items(db_session, restaurant.id)
    assert count == 1


@pytest.mark.asyncio
async def test_update_menu_item(db_session, restaurant):
    item = await create_menu_item(
        db_session,
        MenuItemCreate(name="Old Name", price=100, category=Category.SHAURMA),
        restaurant.id,
    )

    updated = await update_menu_item(
        db_session,
        item,
        MenuItemUpdate(name="New Name", price=200),
    )

    assert updated.name == "New Name"
    assert updated.price == 200
    assert updated.category == Category.SHAURMA.value


@pytest.mark.asyncio
async def test_delete_menu_item_soft_deletes(db_session, restaurant):
    item = await create_menu_item(
        db_session,
        MenuItemCreate(name="To Delete", price=50, category=Category.SHAURMA),
        restaurant.id,
    )

    await delete_menu_item(db_session, item)

    items = await get_menu_items(db_session, restaurant.id)
    assert len(items) == 0

    count = await count_menu_items(db_session, restaurant.id)
    assert count == 0

    fetched = await get_menu_item_by_id(db_session, item.id)
    assert fetched is not None
    assert fetched.is_deleted is True
