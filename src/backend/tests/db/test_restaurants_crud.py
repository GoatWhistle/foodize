import uuid

import pytest

from features.restaurants.crud import (
    count_restaurants,
    count_vendor_restaurants,
    create_restaurant,
    get_all_restaurants,
    get_restaurant_by_id,
    get_vendor_restaurants,
    update_restaurant,
)
from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.roles import UserRole


async def _make_vendor(db_session, phone: str):
    user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number=phone,
            password="strongpassword",
            user_role=UserRole.VENDOR,
        ),
    )
    return await create_vendor_profile(db_session, user, VendorCreate())


@pytest.mark.asyncio
async def test_create_restaurant_crud(db_session):
    vendor_profile = await _make_vendor(db_session, "79001234567")

    restaurant_data = RestaurantCreate(name="My Rest", address="Main St")
    restaurant = await create_restaurant(db_session, restaurant_data, vendor_profile.id)

    assert restaurant.id is not None
    assert restaurant.name == "My Rest"
    assert restaurant.vendor_id == vendor_profile.id


@pytest.mark.asyncio
async def test_get_restaurant_by_id(db_session):
    vendor_profile = await _make_vendor(db_session, "79001234568")

    restaurant = await create_restaurant(
        db_session, RestaurantCreate(name="Find Me", address="Addr"), vendor_profile.id
    )

    fetched = await get_restaurant_by_id(db_session, restaurant.id)
    assert fetched is not None
    assert fetched.id == restaurant.id

    assert await get_restaurant_by_id(db_session, uuid.uuid4()) is None


@pytest.mark.asyncio
async def test_update_restaurant(db_session):
    vendor_profile = await _make_vendor(db_session, "79001234569")

    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Old Name", address="Old Addr"),
        vendor_profile.id,
    )

    updated = await update_restaurant(
        db_session, restaurant, RestaurantUpdate(name="New Name", is_open=False)
    )

    assert updated.name == "New Name"
    assert updated.is_open is False
    assert updated.address == "Old Addr"


@pytest.mark.asyncio
async def test_get_vendor_restaurants_and_count(db_session):
    vendor_profile = await _make_vendor(db_session, "79001234570")

    r1 = await create_restaurant(
        db_session, RestaurantCreate(name="Rest A", address="A"), vendor_profile.id
    )
    r2 = await create_restaurant(
        db_session, RestaurantCreate(name="Rest B", address="B"), vendor_profile.id
    )

    restaurants = await get_vendor_restaurants(db_session, vendor_profile.id)
    assert len(restaurants) == 2
    ids = {r.id for r in restaurants}
    assert r1.id in ids and r2.id in ids

    count = await count_vendor_restaurants(db_session, vendor_profile.id)
    assert count == 2


@pytest.mark.asyncio
async def test_get_all_restaurants_with_filters(db_session):
    vendor_profile = await _make_vendor(db_session, "79001234571")

    await create_restaurant(
        db_session,
        RestaurantCreate(name="Sushi Place", address="C", is_open=True, is_hiring=True),
        vendor_profile.id,
    )
    await create_restaurant(
        db_session,
        RestaurantCreate(
            name="Pizza Place", address="D", is_open=False, is_hiring=False
        ),
        vendor_profile.id,
    )

    all_rests = await get_all_restaurants(db_session)
    assert len(all_rests) == 2

    open_rests = await get_all_restaurants(db_session, is_open=True)
    assert len(open_rests) == 1
    assert open_rests[0].name == "Sushi Place"

    not_hiring = await get_all_restaurants(db_session, is_hiring=False)
    assert len(not_hiring) == 1
    assert not_hiring[0].name == "Pizza Place"

    by_name = await get_all_restaurants(db_session, name="sushi")
    assert len(by_name) == 1

    assert await count_restaurants(db_session, is_open=True) == 1
    assert await count_restaurants(db_session) == 2
