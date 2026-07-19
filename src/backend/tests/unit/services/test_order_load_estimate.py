import uuid
from datetime import UTC, datetime, timedelta
from datetime import time as _dt_time
from typing import cast
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.services.order import (
    estimate_restaurant_load,
    is_open_at,
    validate_requested_pickup_at,
)
from features.restaurants.working_hours import WorkingHours
from shared.exceptions import BadRequestException


def _restaurant(
    *,
    is_open: bool = True,
    is_ordering_paused: bool = False,
    ordering_paused_until: datetime | None = None,
    avg_prep_time_minutes: int = 15,
    max_active_orders: int | None = None,
) -> MagicMock:
    restaurant = MagicMock()
    restaurant.id = uuid.uuid4()
    restaurant.is_open = is_open
    restaurant.is_ordering_paused = is_ordering_paused
    restaurant.ordering_paused_until = ordering_paused_until
    restaurant.avg_prep_time_minutes = avg_prep_time_minutes
    restaurant.max_active_orders = max_active_orders
    return restaurant


def _working_hours_entry(
    *,
    day_of_week: int,
    open_time: str = "09:00",
    close_time: str = "21:00",
    is_closed: bool = False,
) -> WorkingHours:
    entry = MagicMock()
    entry.day_of_week = day_of_week
    open_h, open_m = (int(p) for p in open_time.split(":"))
    close_h, close_m = (int(p) for p in close_time.split(":"))
    entry.open_time = _dt_time(open_h, open_m)
    entry.close_time = _dt_time(close_h, close_m)
    entry.is_closed = is_closed
    return cast("WorkingHours", entry)


async def test_estimate_restaurant_load_warns_with_later_window() -> None:
    restaurant = _restaurant(avg_prep_time_minutes=10, max_active_orders=20)

    with (
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.crud.order.count_active_orders_by_restaurant_id",
            new_callable=AsyncMock,
            return_value=42,
        ),
        patch(
            "features.orders.services.order_queries.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
    ):
        estimate = await estimate_restaurant_load(AsyncMock(), restaurant.id)

    assert estimate.ordering_available is True
    assert estimate.active_orders_count == 42


async def test_estimate_restaurant_load_respects_manual_pause() -> None:
    paused_until = datetime.now(UTC) + timedelta(minutes=30)
    restaurant = _restaurant(is_ordering_paused=True, ordering_paused_until=paused_until)

    with (
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.crud.order.count_active_orders_by_restaurant_id",
            new_callable=AsyncMock,
            return_value=3,
        ),
        patch(
            "features.orders.services.order_queries.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
    ):
        estimate = await estimate_restaurant_load(AsyncMock(), restaurant.id)

    assert estimate.ordering_available is False
    assert estimate.reason == "PAUSED"
    assert estimate.paused_until == paused_until


def test_validate_requested_pickup_at_accepts_later_time() -> None:
    min_ready_at = datetime.now(UTC) + timedelta(minutes=20)
    requested = min_ready_at + timedelta(minutes=15)

    assert validate_requested_pickup_at(requested, min_ready_at) == requested


def test_validate_requested_pickup_at_rejects_too_soon_time() -> None:
    min_ready_at = datetime.now(UTC) + timedelta(minutes=20)
    requested = min_ready_at - timedelta(minutes=1)

    with pytest.raises(BadRequestException):
        validate_requested_pickup_at(requested, min_ready_at)


def test_validate_requested_pickup_at_rejects_far_future_time() -> None:
    min_ready_at = datetime.now(UTC) + timedelta(minutes=20)
    requested = datetime.now(UTC) + timedelta(days=8)

    with pytest.raises(BadRequestException):
        validate_requested_pickup_at(requested, min_ready_at)


def test_is_open_at_accepts_time_inside_working_hours() -> None:
    pickup_at = datetime(2026, 5, 21, 12, 30, tzinfo=UTC)
    hours = [_working_hours_entry(day_of_week=pickup_at.weekday())]

    assert is_open_at(hours, pickup_at) is True


def test_is_open_at_rejects_time_outside_working_hours() -> None:
    pickup_at = datetime(2026, 5, 21, 22, 0, tzinfo=UTC)
    hours = [_working_hours_entry(day_of_week=pickup_at.weekday())]

    assert is_open_at(hours, pickup_at) is False


def test_is_open_at_rejects_closed_day() -> None:
    pickup_at = datetime(2026, 5, 21, 12, 30, tzinfo=UTC)
    hours = [_working_hours_entry(day_of_week=pickup_at.weekday(), is_closed=True)]

    assert is_open_at(hours, pickup_at) is False
