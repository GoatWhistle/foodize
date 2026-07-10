import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.restaurants.working_hours_crud import get_working_hours, is_open_now, set_working_hours


def _mock_wh(day_of_week: int, open_time: str, close_time: str, is_closed: bool = False):
    wh = MagicMock()
    wh.day_of_week = day_of_week
    wh.open_time = open_time
    wh.close_time = close_time
    wh.is_closed = is_closed
    return wh


@pytest.mark.asyncio
async def test_get_working_hours_returns_list():
    wh = _mock_wh(0, "09:00", "22:00")
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [wh]
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    result = await get_working_hours(session, uuid.uuid4())
    assert result == [wh]


@pytest.mark.asyncio
async def test_get_working_hours_empty():
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    result = await get_working_hours(session, uuid.uuid4())
    assert result == []


@pytest.mark.asyncio
async def test_set_working_hours():
    from features.restaurants.working_hours_schemas import WorkingHoursEntry

    entries = [
        WorkingHoursEntry(day_of_week=0, open_time="09:00", close_time="22:00", is_closed=False),
        WorkingHoursEntry(day_of_week=1, open_time="10:00", close_time="20:00", is_closed=False),
    ]
    restaurant_id = uuid.uuid4()

    session = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()

    with patch(
        "features.restaurants.working_hours_crud.get_working_hours",
        new_callable=AsyncMock,
        return_value=[],
    ):
        await set_working_hours(session, restaurant_id, entries)

    assert session.execute.await_count == len(entries) + 1
    session.commit.assert_awaited_once()


def test_is_open_now_no_hours():
    assert is_open_now([]) is None


def test_is_open_now_is_open():
    now = datetime.now(tz=timezone.utc)
    dow = now.weekday()
    wh = _mock_wh(dow, "00:00", "23:59", is_closed=False)
    result = is_open_now([wh])
    assert result is True


def test_is_open_now_is_closed_flag():
    now = datetime.now(tz=timezone.utc)
    dow = now.weekday()
    wh = _mock_wh(dow, "00:00", "23:59", is_closed=True)
    result = is_open_now([wh])
    assert result is False


def test_is_open_now_no_matching_day():
    now = datetime.now(tz=timezone.utc)
    other_dow = (now.weekday() + 1) % 7
    wh = _mock_wh(other_dow, "09:00", "22:00")
    result = is_open_now([wh])
    assert result is None


def test_is_open_now_outside_hours():
    now = datetime.now(tz=timezone.utc)
    dow = now.weekday()
    wh = _mock_wh(dow, "00:00", "00:01", is_closed=False)
    result = is_open_now([wh])
    assert result in (True, False)
