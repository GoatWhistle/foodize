import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.crud.vendors import (
    count_all_vendors,
    deactivate_vendor,
    get_all_vendors,
    get_vendor_by_id,
    set_vendor_moderation,
)
from shared.enums.moderation_status import ModerationStatus
from shared.enums.permissions import Permission
from shared.permissions import (
    ADMIN_PERMISSIONS,
    has_permission,
    serialize_permissions,
)

from .admin_seed import AdminSeed, seed_admin_crud_data


@pytest.fixture
async def seeded_db(db_session: AsyncSession) -> AdminSeed:
    return await seed_admin_crud_data(db_session)


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_get_all_vendors_and_filters(db_session: AsyncSession) -> None:
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


@pytest.mark.usefixtures("seeded_db")
@pytest.mark.usefixtures("seeded_db")
async def test_count_all_vendors_with_filters(db_session: AsyncSession) -> None:
    assert await count_all_vendors(db_session) == 1
    assert await count_all_vendors(db_session, search="Alice") == 1
    assert await count_all_vendors(db_session, search="ghost") == 0
    assert await count_all_vendors(db_session, approval_status=ModerationStatus.PENDING.value) == 1


async def test_get_vendor_by_id_found_and_missing(
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    vendor_profile = seeded_db.vendor_profile
    found = await get_vendor_by_id(db_session, vendor_profile.id)
    assert found is not None
    assert found.id == vendor_profile.id
    assert found.user.name == "Alice Vendor"

    assert await get_vendor_by_id(db_session, uuid.uuid4()) is None


async def test_deactivate_vendor_strips_permissions(
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    vendor_profile = seeded_db.vendor_profile
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
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    vendor_profile = seeded_db.vendor_profile
    vendor = await get_vendor_by_id(db_session, vendor_profile.id)
    assert vendor is not None
    vendor.user.permissions = serialize_permissions(ADMIN_PERMISSIONS)

    result = await deactivate_vendor(db_session, vendor)
    assert has_permission(result.user.permissions, Permission.ADMIN_ACCESS)


async def test_set_vendor_moderation_approved_grants_permissions(
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    vendor_profile = seeded_db.vendor_profile
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
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    vendor_profile = seeded_db.vendor_profile
    vendor = await get_vendor_by_id(db_session, vendor_profile.id)
    assert vendor is not None
    vendor.user.permissions = serialize_permissions(ADMIN_PERMISSIONS)

    result = await set_vendor_moderation(db_session, vendor, ModerationStatus.APPROVED.value)
    assert has_permission(result.user.permissions, Permission.ADMIN_ACCESS)


async def test_set_vendor_moderation_rejected_and_pending(
    db_session: AsyncSession, seeded_db: AdminSeed
) -> None:
    vendor_profile = seeded_db.vendor_profile
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
