import pytest

from features.restaurants.crud import create_restaurant_in_db, get_vendor_restaurants_from_db
from features.restaurants.schemas import RestaurantCreate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendors_profile
from features.vendors.schemas import CreateVendor
from shared.enums.roles import UserRole


@pytest.mark.asyncio
async def test_create_restaurant_crud(db_session):
    user_data = UserCreate(
        name="Vendor",
        phone_number="79001234567",
        password="strongpassword",
        user_role=UserRole.VENDOR,
    )
    user = await create_user(db_session, user_data)

    vendor_data = CreateVendor(description="Test Vendor")
    vendor_profile = await create_vendors_profile(db_session, user, vendor_data)

    restaurant_data = RestaurantCreate(name="My Rest", address="Main St")
    restaurant = await create_restaurant_in_db(db_session, restaurant_data, vendor_profile.id)

    assert restaurant.id is not None
    assert restaurant.name == "My Rest"
    assert restaurant.vendor_id == vendor_profile.id

    restaurants = await get_vendor_restaurants_from_db(db_session, vendor_profile.id)
    assert len(restaurants) == 1
    assert restaurants[0].id == restaurant.id
