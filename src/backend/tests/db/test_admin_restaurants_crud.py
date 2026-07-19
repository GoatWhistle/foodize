import uuid
from typing import TYPE_CHECKING, Any

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.crud.restaurants import (
    count_all_restaurants,
    count_all_vendors,
    deactivate_restaurant,
    deactivate_vendor,
    get_all_restaurants,
    get_all_vendors,
    get_restaurant_by_id,
    get_vendor_by_id,
    set_restaurant_moderation,
    set_vendor_moderation,
)
from features.orders.models import Order
from features.restaurants.crud import create_restaurant
from features.restaurants.schemas import RestaurantCreate
from features.reviews.models import Review
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.moderation_status import ModerationStatus
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission
from shared.permissions import (
    ADMIN_PERMISSIONS,
    VENDOR_PERMISSIONS,
    has_permission,
    serialize_permissions,
)

if TYPE_CHECKING:
    from features.restaurants.models import Restaurant


@pytest.fixture
async def seeded_db(db_session: AsyncSession) -> dict[str, Any]:
    vendor_user = await create_user(
        db_session,
        UserCreate(name="Alice Vendor", phone_number="79009001001", password="strongpassword1"),
    )
    vendor_user.permissions = serialize_permissions(VENDOR_PERMISSIONS)
    vendor_profile = await create_vendor_profile(db_session, vendor_user, VendorCreate())

    customer = await create_user(
        db_session,
        UserCreate(name="Bob Customer", phone_number="79009001002", password="strongpassword1"),
    )

    restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Sushi Palace", address="Main St", is_open=True),
        vendor_profile.id,
    )
    restaurant.moderation_status = ModerationStatus.APPROVED.value

    other_restaurant = await create_restaurant(
        db_session,
        RestaurantCreate(name="Pizza Corner", address="Second St", is_open=False),
        vendor_profile.id,
    )
    other_restaurant.moderation_status = ModerationStatus.PENDING.value

    review = Review(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        rating=4,
        text="Great",
        is_verified_purchase=True,
    )
    db_session.add(review)

    completed = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=300,
        status=OrderStatus.COMPLETED.value,
    )
    pending = Order(
        user_id=customer.id,
        restaurant_id=restaurant.id,
        total_price=200,
        status=OrderStatus.PENDING.value,
    )
    db_session.add_all([completed, pending])
    await db_session.commit()

    return {
        "vendor_user": vendor_user,
        "vendor_profile": vendor_profile,
        "customer": customer,
        "restaurant": restaurant,
        "other_restaurant": other_restaurant,
    }


async def test_get_all_restaurants_maps_aggregates(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    results = await get_all_restaurants(db_session)
    assert len(results) == 2
    by_name = {r.name: r for r in results}
    sushi = by_name["Sushi Palace"]
    assert sushi.vendor_name == "Alice Vendor"
    assert sushi.vendor_phone == "79009001001"
    assert sushi.average_rating == 4.0
    assert sushi.review_count == 1
    assert sushi.orders_count == 1
    assert by_name["Pizza Corner"].orders_count == 0


async def test_get_all_restaurants_search_filter(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    results = await get_all_restaurants(db_session, search="sushi")
    assert len(results) == 1
    assert results[0].name == "Sushi Palace"


async def test_get_all_restaurants_vendor_search_filter(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    by_name = await get_all_restaurants(db_session, vendor_search="Alice")
    assert len(by_name) == 2
    by_phone = await get_all_restaurants(db_session, vendor_search="79009001001")
    assert len(by_phone) == 2
    empty = await get_all_restaurants(db_session, vendor_search="nobody")
    assert empty == []


async def test_get_all_restaurants_is_open_filter(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    open_only = await get_all_restaurants(db_session, is_open=True)
    assert [r.name for r in open_only] == ["Sushi Palace"]
    closed_only = await get_all_restaurants(db_session, is_open=False)
    assert [r.name for r in closed_only] == ["Pizza Corner"]


async def test_get_all_restaurants_moderation_and_min_rating(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    approved = await get_all_restaurants(
        db_session, moderation_status=ModerationStatus.APPROVED.value
    )
    assert [r.name for r in approved] == ["Sushi Palace"]

    rated = await get_all_restaurants(db_session, min_rating=3.5)
    assert [r.name for r in rated] == ["Sushi Palace"]

    too_high = await get_all_restaurants(db_session, min_rating=4.5)
    assert too_high == []


async def test_count_all_restaurants_with_filters(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    assert await count_all_restaurants(db_session) == 2
    assert await count_all_restaurants(db_session, is_open=True) == 1
    assert await count_all_restaurants(db_session, search="pizza") == 1
    assert (
        await count_all_restaurants(db_session, moderation_status=ModerationStatus.PENDING.value)
        == 1
    )
    assert await count_all_restaurants(db_session, min_rating=4.5) == 0


async def test_get_restaurant_by_id_found_and_missing(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    restaurant = seeded_db["restaurant"]
    found = await get_restaurant_by_id(db_session, restaurant.id)
    assert found is not None
    assert found.id == restaurant.id
    assert found.review_count == 1

    assert await get_restaurant_by_id(db_session, uuid.uuid4()) is None


async def test_deactivate_restaurant_found_and_missing(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    restaurant = seeded_db["restaurant"]
    deactivated = await deactivate_restaurant(db_session, restaurant.id)
    assert deactivated is not None
    assert deactivated.is_active is False
    assert deactivated.is_open is False
    assert deactivated.is_hiring is False

    assert await deactivate_restaurant(db_session, uuid.uuid4()) is None


async def test_set_restaurant_moderation_approved_and_rejected(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    restaurant = seeded_db["other_restaurant"]
    approved = await set_restaurant_moderation(
        db_session, restaurant, ModerationStatus.APPROVED.value
    )
    assert approved.moderation_status == ModerationStatus.APPROVED.value
    assert approved.rejection_reason is None

    rejected = await set_restaurant_moderation(
        db_session, restaurant, ModerationStatus.REJECTED.value, reason="bad photos"
    )
    assert rejected.moderation_status == ModerationStatus.REJECTED.value
    assert rejected.rejection_reason == "bad photos"


async def test_get_all_vendors_and_filters(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    vendors = await get_all_vendors(db_session)
    assert len(vendors) == 1
    assert vendors[0].user.name == "Alice Vendor"
    assert len(vendors[0].restaurants) == 2

    by_search = await get_all_vendors(db_session, search="Alice")
    assert len(by_search) == 1

    by_phone = await get_all_vendors(db_session, search="79009001001")
    assert len(by_phone) == 1

    none_found = await get_all_vendors(db_session, search="ghost")
    assert none_found == []

    by_status = await get_all_vendors(db_session, approval_status=ModerationStatus.PENDING.value)
    assert len(by_status) == 1


async def test_count_all_vendors_with_filters(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    assert await count_all_vendors(db_session) == 1
    assert await count_all_vendors(db_session, search="Alice") == 1
    assert await count_all_vendors(db_session, search="ghost") == 0
    assert await count_all_vendors(db_session, approval_status=ModerationStatus.PENDING.value) == 1


async def test_get_vendor_by_id_found_and_missing(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    vendor_profile = seeded_db["vendor_profile"]
    found = await get_vendor_by_id(db_session, vendor_profile.id)
    assert found is not None
    assert found.id == vendor_profile.id
    assert found.user.name == "Alice Vendor"

    assert await get_vendor_by_id(db_session, uuid.uuid4()) is None


async def test_deactivate_vendor_strips_permissions(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    vendor_profile = seeded_db["vendor_profile"]
    vendor = await get_vendor_by_id(db_session, vendor_profile.id)
    assert vendor is not None

    await deactivate_vendor(db_session, vendor)
    refetched = await get_vendor_by_id(db_session, vendor_profile.id)
    assert refetched is not None
    assert not has_permission(refetched.user.permissions, Permission.RESTAURANTS_CREATE)
    for restaurant in refetched.restaurants:
        assert restaurant.is_active is False
        assert restaurant.is_open is False


async def test_deactivate_vendor_keeps_admin_permissions(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    vendor_profile = seeded_db["vendor_profile"]
    vendor = await get_vendor_by_id(db_session, vendor_profile.id)
    assert vendor is not None
    vendor.user.permissions = serialize_permissions(ADMIN_PERMISSIONS)

    result = await deactivate_vendor(db_session, vendor)
    assert has_permission(result.user.permissions, Permission.ADMIN_ACCESS)


async def test_set_vendor_moderation_approved_grants_permissions(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    vendor_profile = seeded_db["vendor_profile"]
    vendor = await get_vendor_by_id(db_session, vendor_profile.id)
    assert vendor is not None
    vendor.user.permissions = serialize_permissions([])

    result = await set_vendor_moderation(db_session, vendor, ModerationStatus.APPROVED.value)
    assert result.approval_status == ModerationStatus.APPROVED.value
    assert result.rejection_reason is None

    refetched = await get_vendor_by_id(db_session, vendor_profile.id)
    assert refetched is not None
    assert has_permission(refetched.user.permissions, Permission.RESTAURANTS_CREATE)
    for restaurant in refetched.restaurants:
        assert restaurant.moderation_status == ModerationStatus.APPROVED.value


async def test_set_vendor_moderation_approved_admin_keeps_permissions(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    vendor_profile = seeded_db["vendor_profile"]
    vendor = await get_vendor_by_id(db_session, vendor_profile.id)
    assert vendor is not None
    vendor.user.permissions = serialize_permissions(ADMIN_PERMISSIONS)

    result = await set_vendor_moderation(db_session, vendor, ModerationStatus.APPROVED.value)
    assert has_permission(result.user.permissions, Permission.ADMIN_ACCESS)


async def test_set_vendor_moderation_rejected_and_pending(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    vendor_profile = seeded_db["vendor_profile"]
    vendor = await get_vendor_by_id(db_session, vendor_profile.id)
    assert vendor is not None

    rejected = await set_vendor_moderation(
        db_session, vendor, ModerationStatus.REJECTED.value, reason="incomplete"
    )
    assert rejected.approval_status == ModerationStatus.REJECTED.value
    assert rejected.rejection_reason == "incomplete"

    pending = await set_vendor_moderation(db_session, vendor, ModerationStatus.PENDING.value)
    assert pending.approval_status == ModerationStatus.PENDING.value
    assert pending.rejection_reason is None


async def test_get_all_restaurants_excludes_inactive(
    db_session: AsyncSession, seeded_db: dict[str, Any]
) -> None:
    restaurant: Restaurant = seeded_db["restaurant"]
    await deactivate_restaurant(db_session, restaurant.id)
    await db_session.flush()
    results = await get_all_restaurants(db_session)
    assert all(r.name != "Sushi Palace" for r in results)
