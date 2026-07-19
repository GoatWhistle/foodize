from datetime import UTC, datetime, tzinfo
from datetime import time as dt_time

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from features.restaurants.crud import create_restaurant
from features.restaurants.models import Restaurant
from features.restaurants.schemas import RestaurantCreate
from features.restaurants.working_hours_crud import (
    get_working_hours,
    is_open_now,
    set_working_hours,
)
from features.restaurants.working_hours_schemas import WorkingHoursEntry
from features.users.crud import create_user
from features.users.schemas import UserCreate
from features.vendors.crud import create_vendor_profile
from features.vendors.schemas import VendorCreate
from shared.enums.roles import UserRole


async def _make_restaurant(db_session: AsyncSession) -> Restaurant:
    user = await create_user(
        db_session,
        UserCreate(
            name="Vendor",
            phone_number="79009990000",
            password="strongpassword1",
            user_role=UserRole.VENDOR,
        ),
    )
    vendor = await create_vendor_profile(db_session, user, VendorCreate())
    return await create_restaurant(
        db_session,
        RestaurantCreate(name="Hours Cafe", address="Hours Street"),
        vendor.id,
    )


async def test_set_working_hours_replaces_existing_rows(db_session: AsyncSession) -> None:
    restaurant = await _make_restaurant(db_session)

    first = [
        WorkingHoursEntry(day_of_week=0, open_time="09:00", close_time="18:00"),
        WorkingHoursEntry(day_of_week=1, open_time="10:00", close_time="19:00"),
    ]
    second = [
        WorkingHoursEntry(
            day_of_week=2,
            open_time="00:00",
            close_time="00:00",
            is_closed=True,
        )
    ]

    await set_working_hours(db_session, restaurant.id, first)
    rows = await set_working_hours(db_session, restaurant.id, second)
    fetched = await get_working_hours(db_session, restaurant.id)

    assert len(rows) == 1
    assert len(fetched) == 1
    assert fetched[0].day_of_week == 2
    assert fetched[0].is_closed is True


def test_is_open_now_returns_none_without_hours() -> None:
    assert is_open_now([]) is None


def test_is_open_now_handles_open_closed_and_missing_days(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    class FixedDateTime(datetime):
        @classmethod
        def now(cls, tz: tzinfo | None = None) -> datetime:  # type: ignore[override]
            return datetime(2026, 5, 21, 12, 0, tzinfo=UTC)

    monkeypatch.setattr(
        "features.restaurants.working_hours_crud.datetime",
        FixedDateTime,
    )

    def _parse(value: str) -> dt_time:
        hour, minute = value.split(":")
        return dt_time(int(hour), int(minute))

    class Hours:
        def __init__(
            self,
            day_of_week: int,
            open_time: str,
            close_time: str,
            is_closed: bool = False,
        ) -> None:
            self.day_of_week = day_of_week
            self.open_time = _parse(open_time)
            self.close_time = _parse(close_time)
            self.is_closed = is_closed

    assert is_open_now([Hours(3, "09:00", "18:00")]) is True  # type: ignore[list-item]
    assert is_open_now([Hours(3, "13:00", "18:00")]) is False  # type: ignore[list-item]
    assert is_open_now([Hours(3, "09:00", "18:00", is_closed=True)]) is False  # type: ignore[list-item]
    assert is_open_now([Hours(4, "09:00", "18:00")]) is None  # type: ignore[list-item]
