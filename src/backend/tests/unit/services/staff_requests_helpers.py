import uuid
from contextlib import AbstractContextManager
from unittest.mock import AsyncMock, MagicMock, patch

from shared.enums.staff_request_status import StaffRequestStatus


def make_staff_request(
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


def patch_restaurant(is_hiring: bool) -> AbstractContextManager[AsyncMock]:
    return patch(
        "features.staff.dependencies.get_restaurant_by_id",
        new_callable=AsyncMock,
        return_value=_restaurant(is_hiring),
    )
