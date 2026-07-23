import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.staff.service import (
    get_vendor_staff_members,
    remove_staff_member,
)
from shared.exceptions import NotFoundException


def _make_profile() -> MagicMock:
    p = MagicMock()
    p.id = uuid.uuid4()
    p.user_id = uuid.uuid4()
    p.restaurant_id = uuid.uuid4()
    p.role = "COOK"
    p.restaurant = MagicMock()
    p.restaurant.name = "Тест Кафе"
    p.user = MagicMock()
    p.user.name = "Сотрудник"
    p.user.phone_number = "79001234567"
    return p


class TestGetVendorStaffMembers:
    async def test_returns_members_with_details(self) -> None:
        session = AsyncMock()
        profile = _make_profile()
        with (
            patch(
                "features.staff.service.crud.get_staff_profiles_by_vendor_id",
                new_callable=AsyncMock,
                return_value=[profile],
            ),
            patch(
                "features.staff.service.crud.count_staff_profiles_by_vendor_id",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            members, total = await get_vendor_staff_members(session, uuid.uuid4())
            assert total == 1
            assert len(members) == 1
            assert members[0].role == "COOK"
            assert members[0].restaurant_name == "Тест Кафе"
            assert members[0].user_name == "Сотрудник"

    async def test_handles_missing_restaurant_and_user(self) -> None:
        session = AsyncMock()
        profile = _make_profile()
        profile.restaurant = None
        profile.user = None
        with (
            patch(
                "features.staff.service.crud.get_staff_profiles_by_vendor_id",
                new_callable=AsyncMock,
                return_value=[profile],
            ),
            patch(
                "features.staff.service.crud.count_staff_profiles_by_vendor_id",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            members, _ = await get_vendor_staff_members(session, uuid.uuid4())
            assert members[0].restaurant_name is None
            assert members[0].user_name is None

    async def test_offset_from_page(self) -> None:
        session = AsyncMock()
        with (
            patch(
                "features.staff.service.crud.get_staff_profiles_by_vendor_id",
                new_callable=AsyncMock,
                return_value=[],
            ) as mock_get,
            patch(
                "features.staff.service.crud.count_staff_profiles_by_vendor_id",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            await get_vendor_staff_members(session, uuid.uuid4(), page=3, size=10)
            assert mock_get.call_args.kwargs["offset"] == 20


class TestRemoveStaffMember:
    async def test_raises_not_found_when_profile_missing(self) -> None:
        session = AsyncMock()
        with (
            patch(
                "features.staff.service.crud.get_staff_profile_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
            pytest.raises(NotFoundException),
        ):
            await remove_staff_member(session, uuid.uuid4(), uuid.uuid4())

    async def test_raises_access_denied_when_wrong_vendor(self) -> None:
        session = AsyncMock()
        profile = _make_profile()
        restaurant = MagicMock()
        restaurant.vendor_id = uuid.uuid4()
        result = MagicMock()
        result.scalar_one_or_none.return_value = restaurant
        session.execute = AsyncMock(return_value=result)
        with (
            patch(
                "features.staff.service.crud.get_staff_profile_by_id",
                new_callable=AsyncMock,
                return_value=profile,
            ),
            pytest.raises(NotFoundException),
        ):
            await remove_staff_member(session, profile.id, uuid.uuid4())

    async def test_raises_not_found_when_restaurant_not_found(self) -> None:
        session = AsyncMock()
        profile = _make_profile()
        result = MagicMock()
        result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=result)
        with (
            patch(
                "features.staff.service.crud.get_staff_profile_by_id",
                new_callable=AsyncMock,
                return_value=profile,
            ),
            pytest.raises(NotFoundException),
        ):
            await remove_staff_member(session, profile.id, uuid.uuid4())

    async def test_deletes_profile_when_authorized(self) -> None:
        session = AsyncMock()
        vendor_id = uuid.uuid4()
        profile = _make_profile()
        restaurant = MagicMock()
        restaurant.vendor_id = vendor_id
        result = MagicMock()
        result.scalar_one_or_none.return_value = restaurant
        session.execute = AsyncMock(return_value=result)
        with (
            patch(
                "features.staff.service.crud.get_staff_profile_by_id",
                new_callable=AsyncMock,
                return_value=profile,
            ),
            patch(
                "features.staff.service.crud.delete_staff_profile", new_callable=AsyncMock
            ) as mock_delete,
        ):
            await remove_staff_member(session, profile.id, vendor_id)
            mock_delete.assert_called_once_with(session, profile)
