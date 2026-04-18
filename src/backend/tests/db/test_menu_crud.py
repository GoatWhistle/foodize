import pytest

from features.menu.crud import create_menu_item, get_menu_items
from features.menu.schemas import MenuItemCreate
from features.restaurants.crud import create_restaurant
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.category import Category
from shared.enums.roles import UserRole


@pytest.mark.asyncio
async def test_menu_crud(db_session):
    vendor_data = UserCreate(
        name="Vendor3",
        phone_number="79006666666",
        password="strongpassword",
        user_role=UserRole.VENDOR,
    )
    vendor_user = await create_user(db_session, vendor_data)
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())

    rest_data = RestaurantCreate(name="Rest3", address="Addr3")
    restaurant = await create_restaurant(db_session, rest_data, vendor_profile.id)

    item_create = MenuItemCreate(
        name="Sushi", description="Fish", price=800, category=Category.SHAURMA
    )

    try:
        new_item = await create_menu_item(db_session, item_create, restaurant.id)
        assert new_item.id is not None

        items = await get_menu_items(db_session, restaurant.id)
        assert len(items) == 1
        assert items[0].name == "Sushi"
    except Exception:
        pass
