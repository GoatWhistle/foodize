import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.crud.restaurants import (
    count_all_restaurants,
    deactivate_restaurant,
    get_all_restaurants,
    get_restaurant_by_id,
    set_restaurant_moderation,
)
from shared.enums.moderation_status import ModerationStatus

from .admin_seed import AdminSeed, seed_admin_crud_data


@pytest.fixture
async def seeded_db(db_session: AsyncSession) -> AdminSeed:
    return await seed_admin_crud_data(db_session)


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_get_all_restaurants_maps_aggregates(
    db_session: AsyncSession
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


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_get_all_restaurants_search_filter(
    db_session: AsyncSession
) -> None:
    results = await get_all_restaurants(db_session, search="sushi")
    assert len(results) == 1
    assert results[0].name == "Sushi Palace"


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_get_all_restaurants_vendor_search_filter(
    db_session: AsyncSession
) -> None:
    by_name = await get_all_restaurants(db_session, vendor_search="Alice")
    assert len(by_name) == 2
    by_phone = await get_all_restaurants(db_session, vendor_search="79009001001")
    assert len(by_phone) == 2
    empty = await get_all_restaurants(db_session, vendor_search="nobody")
    assert empty == []


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_get_all_restaurants_is_open_filter(
    db_session: AsyncSession
) -> None:
    open_only = await get_all_restaurants(db_session, is_open=True)
    assert [r.name for r in open_only] == ["Sushi Palace"]
    closed_only = await get_all_restaurants(db_session, is_open=False)
    assert [r.name for r in closed_only] == ["Pizza Corner"]


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_get_all_restaurants_moderation_and_min_rating(
    db_session: AsyncSession
) -> None:
    approved = await get_all_restaurants(
        db_session, moderation_status=ModerationStatus.APPROVED.value
    )
    assert [r.name for r in approved] == ["Sushi Palace"]

    rated = await get_all_restaurants(db_session, min_rating=3.5)
    assert [r.name for r in rated] == ["Sushi Palace"]

    too_high = await get_all_restaurants(db_session, min_rating=4.5)
    assert too_high == []


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_count_all_restaurants_with_filters(
    db_session: AsyncSession
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
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    restaurant = seeded_db.restaurant
    found = await get_restaurant_by_id(db_session, restaurant.id)
    assert found is not None
    assert found.id == restaurant.id
    assert found.review_count == 1

    assert await get_restaurant_by_id(db_session, uuid.uuid4()) is None


async def test_deactivate_restaurant_found_and_missing(
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    restaurant = seeded_db.restaurant
    deactivated = await deactivate_restaurant(db_session, restaurant.id)
    assert deactivated is not None
    assert deactivated.is_active is False
    assert deactivated.is_open is False
    assert deactivated.is_hiring is False

    assert await deactivate_restaurant(db_session, uuid.uuid4()) is None


async def test_set_restaurant_moderation_approved_and_rejected(
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    restaurant = seeded_db.other_restaurant
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


async def test_get_all_restaurants_excludes_inactive(
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    restaurant = seeded_db.restaurant
    await deactivate_restaurant(db_session, restaurant.id)
    await db_session.flush()
    results = await get_all_restaurants(db_session)
    assert all(r.name != "Sushi Palace" for r in results)
