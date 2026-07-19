import uuid
from contextlib import AbstractContextManager
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.staff.exceptions import (
    AlreadyStaffException,
    RestaurantNotHiringException,
    StaffRequestActiveExistsException,
    StaffRequestCooldownException,
)
from features.staff.schemas import StaffRequestCreate
from features.staff.service import (
    create_staff_request,
    get_vendor_staff_requests,
    process_staff_request,
)
from shared.enums.staff_request_status import StaffRequestStatus


def _make_staff_request(
    status: StaffRequestStatus = StaffRequestStatus.PENDING,
) -> MagicMock:
    r = MagicMock()
    r.id = uuid.uuid4()
    r.user_id = uuid.uuid4()
    r.restaurant_id = uuid.uuid4()
    r.message = None
    r.status = status
    return r


def _restaurant(is_hiring: bool) -> MagicMock:
    restaurant = MagicMock()
    restaurant.is_hiring = is_hiring
    return restaurant


def _patch_restaurant(is_hiring: bool) -> AbstractContextManager[AsyncMock]:
    return patch(
        "features.staff.dependencies.get_restaurant_by_id",
        new_callable=AsyncMock,
        return_value=_restaurant(is_hiring),
    )


class TestCreateStaffRequest:
    async def test_success(self) -> None:
        user_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        request_data = StaffRequestCreate(message="Хочу работать")

        mock_request = _make_staff_request(StaffRequestStatus.PENDING)

        with (
            _patch_restaurant(is_hiring=True),
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "features.staff.crud.get_last_request",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch(
                "features.staff.crud.create_staff_request",
                new_callable=AsyncMock,
                return_value=mock_request,
            ),
        ):
            result = await create_staff_request(MagicMock(), user_id, restaurant_id, request_data)
            assert result.user_id == mock_request.user_id

    async def test_not_hiring(self) -> None:
        with _patch_restaurant(is_hiring=False):
            with pytest.raises(RestaurantNotHiringException):
                await create_staff_request(
                    MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
                )

    async def test_already_staff(self) -> None:
        with (
            _patch_restaurant(is_hiring=True),
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=True,
            ),
        ):
            with pytest.raises(AlreadyStaffException):
                await create_staff_request(
                    MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
                )

    async def test_active_request_exists(self) -> None:
        last = MagicMock()
        last.status = StaffRequestStatus.PENDING.value

        with (
            _patch_restaurant(is_hiring=True),
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "features.staff.crud.get_last_request",
                new_callable=AsyncMock,
                return_value=last,
            ),
        ):
            with pytest.raises(StaffRequestActiveExistsException):
                await create_staff_request(
                    MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
                )

    async def test_cooldown_after_rejection(self) -> None:
        last = MagicMock()
        last.status = StaffRequestStatus.REJECTED.value
        last.updated_at = datetime.now(UTC) - timedelta(hours=1)

        with (
            _patch_restaurant(is_hiring=True),
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "features.staff.crud.get_last_request",
                new_callable=AsyncMock,
                return_value=last,
            ),
        ):
            with pytest.raises(StaffRequestCooldownException):
                await create_staff_request(
                    MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
                )

    async def test_after_cooldown_passes(self) -> None:
        last = MagicMock()
        last.status = StaffRequestStatus.REJECTED.value
        last.updated_at = datetime.now(UTC) - timedelta(hours=25)

        mock_request = _make_staff_request(StaffRequestStatus.PENDING)

        with (
            _patch_restaurant(is_hiring=True),
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "features.staff.crud.get_last_request",
                new_callable=AsyncMock,
                return_value=last,
            ),
            patch(
                "features.staff.crud.create_staff_request",
                new_callable=AsyncMock,
                return_value=mock_request,
            ),
        ):
            result = await create_staff_request(
                MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
            )
            assert result.id == mock_request.id


class TestProcessStaffRequest:
    async def test_accept_success(self) -> None:
        request = MagicMock()
        request.user_id = uuid.uuid4()
        request.restaurant_id = uuid.uuid4()

        updated = _make_staff_request(StaffRequestStatus.ACCEPTED)

        with (
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch("features.staff.crud.create_staff_profile", new_callable=AsyncMock),
            patch(
                "features.staff.crud.update_request_status",
                new_callable=AsyncMock,
                return_value=updated,
            ),
        ):
            result = await process_staff_request(MagicMock(), request, StaffRequestStatus.ACCEPTED)
            assert result.status == StaffRequestStatus.ACCEPTED

    async def test_accept_already_staff(self) -> None:
        request = MagicMock()
        request.user_id = uuid.uuid4()

        with (
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch("features.staff.crud.update_request_status", new_callable=AsyncMock),
        ):
            with pytest.raises(AlreadyStaffException):
                await process_staff_request(MagicMock(), request, StaffRequestStatus.ACCEPTED)

    async def test_reject_success(self) -> None:
        request = MagicMock()
        updated = _make_staff_request(StaffRequestStatus.REJECTED)

        with patch(
            "features.staff.crud.update_request_status",
            new_callable=AsyncMock,
            return_value=updated,
        ):
            result = await process_staff_request(MagicMock(), request, StaffRequestStatus.REJECTED)
            assert result.status == StaffRequestStatus.REJECTED


class TestGetVendorStaffRequests:
    async def test_success(self) -> None:
        vendor_id = uuid.uuid4()
        r = _make_staff_request()

        with (
            patch(
                "features.staff.crud.get_requests_by_vendor_id",
                new_callable=AsyncMock,
                return_value=[r],
            ),
            patch(
                "features.staff.crud.count_requests_by_vendor_id",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            data, total = await get_vendor_staff_requests(MagicMock(), vendor_id)
            assert len(data) == 1
            assert total == 1

    async def test_empty(self) -> None:
        with (
            patch(
                "features.staff.crud.get_requests_by_vendor_id",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.staff.crud.count_requests_by_vendor_id",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            data, total = await get_vendor_staff_requests(MagicMock(), uuid.uuid4())
            assert data == []
            assert total == 0
