import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.staff.exceptions import AlreadyStaffException
from features.staff.service import get_vendor_staff_requests, process_staff_request
from shared.enums.staff_request_status import StaffRequestStatus

from .staff_requests_helpers import make_staff_request


class TestProcessStaffRequest:
    async def test_accept_success(self) -> None:
        request = MagicMock()
        request.user_id = uuid.uuid4()
        request.restaurant_id = uuid.uuid4()

        updated = make_staff_request(StaffRequestStatus.ACCEPTED)

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
            pytest.raises(AlreadyStaffException),
        ):
            await process_staff_request(MagicMock(), request, StaffRequestStatus.ACCEPTED)

    async def test_reject_success(self) -> None:
        request = MagicMock()
        updated = make_staff_request(StaffRequestStatus.REJECTED)

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
        r = make_staff_request()

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
