import uuid
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
from features.staff.service import create_staff_request
from shared.enums.staff_request_status import StaffRequestStatus

from .staff_requests_helpers import make_staff_request, patch_restaurant


class TestCreateStaffRequest:
    async def test_success(self) -> None:
        user_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        request_data = StaffRequestCreate(message="Хочу работать")

        mock_request = make_staff_request(StaffRequestStatus.PENDING)

        with (
            patch_restaurant(is_hiring=True),
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
        with patch_restaurant(is_hiring=False), pytest.raises(RestaurantNotHiringException):
            await create_staff_request(
                MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
            )

    async def test_already_staff(self) -> None:
        with (
            patch_restaurant(is_hiring=True),
            patch(
                "features.staff.crud.staff_profile_exists",
                new_callable=AsyncMock,
                return_value=True,
            ),
            pytest.raises(AlreadyStaffException),
        ):
            await create_staff_request(
                MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
            )

    async def test_active_request_exists(self) -> None:
        last = MagicMock()
        last.status = StaffRequestStatus.PENDING.value

        with (
            patch_restaurant(is_hiring=True),
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
            pytest.raises(StaffRequestActiveExistsException),
        ):
            await create_staff_request(
                MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
            )

    async def test_cooldown_after_rejection(self) -> None:
        last = MagicMock()
        last.status = StaffRequestStatus.REJECTED.value
        last.updated_at = datetime.now(UTC) - timedelta(hours=1)

        with (
            patch_restaurant(is_hiring=True),
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
            pytest.raises(StaffRequestCooldownException),
        ):
            await create_staff_request(
                MagicMock(), uuid.uuid4(), uuid.uuid4(), StaffRequestCreate()
            )

    async def test_after_cooldown_passes(self) -> None:
        last = MagicMock()
        last.status = StaffRequestStatus.REJECTED.value
        last.updated_at = datetime.now(UTC) - timedelta(hours=25)

        mock_request = make_staff_request(StaffRequestStatus.PENDING)

        with (
            patch_restaurant(is_hiring=True),
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
