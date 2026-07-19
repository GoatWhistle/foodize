import uuid
from datetime import UTC, datetime
from datetime import time as dt_time
from unittest.mock import AsyncMock, MagicMock, patch

from features.restaurants.working_hours_crud import (
    get_working_hours,
    is_open_now,
    set_working_hours,
)
from features.restaurants.working_hours_schemas import WorkingHoursEntry


def _parse(value: str) -> dt_time:
    hour, minute = value.split(":")
    return dt_time(int(hour), int(minute))


def _mock_wh(
    day_of_week: int, open_time: str, close_time: str, is_closed: bool = False
) -> MagicMock:
    wh = MagicMock()
    wh.day_of_week = day_of_week
    wh.open_time = _parse(open_time)
    wh.close_time = _parse(close_time)
    wh.is_closed = is_closed
    return wh


async def test_get_working_hours_returns_list() -> None:
    wh = _mock_wh(0, "09:00", "22:00")
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [wh]
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    result = await get_working_hours(session, uuid.uuid4())
    assert result == [wh]


async def test_get_working_hours_empty() -> None:
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    result = await get_working_hours(session, uuid.uuid4())
    assert result == []


async def test_set_working_hours() -> None:

    entries = [
        WorkingHoursEntry(day_of_week=0, open_time="09:00", close_time="22:00", is_closed=False),
        WorkingHoursEntry(day_of_week=1, open_time="10:00", close_time="20:00", is_closed=False),
    ]
    restaurant_id = uuid.uuid4()

    session = AsyncMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock()

    with patch(
        "features.restaurants.working_hours_crud.get_working_hours",
        new_callable=AsyncMock,
        return_value=[],
    ):
        await set_working_hours(session, restaurant_id, entries)

    session.flush.assert_awaited_once()


_FIXED_NOW = datetime(2026, 7, 8, 12, 0, tzinfo=UTC)


def test_is_open_now_no_hours() -> None:
    assert is_open_now([], now=_FIXED_NOW) is None


def test_is_open_now_is_open() -> None:
    dow = _FIXED_NOW.weekday()
    wh = _mock_wh(dow, "09:00", "22:00", is_closed=False)
    result = is_open_now([wh], now=_FIXED_NOW)
    assert result is True


def test_is_open_now_is_closed_flag() -> None:
    dow = _FIXED_NOW.weekday()
    wh = _mock_wh(dow, "00:00", "23:59", is_closed=True)
    result = is_open_now([wh], now=_FIXED_NOW)
    assert result is False


def test_is_open_now_no_matching_day() -> None:
    other_dow = (_FIXED_NOW.weekday() + 1) % 7
    wh = _mock_wh(other_dow, "09:00", "22:00")
    result = is_open_now([wh], now=_FIXED_NOW)
    assert result is None


def test_is_open_now_outside_hours() -> None:
    dow = _FIXED_NOW.weekday()
    wh = _mock_wh(dow, "00:00", "00:01", is_closed=False)
    result = is_open_now([wh], now=_FIXED_NOW)
    assert result is False
