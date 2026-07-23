import uuid
from datetime import UTC, datetime, timedelta
from datetime import time as _time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.exceptions import InvalidStatusTransitionException
from features.orders.services.order_utils import (
    as_aware_utc,
    is_open_at,
    is_ordering_paused,
    make_request_hash,
    safe_publish,
    validate_requested_pickup_at,
    validate_transition,
)
from shared.enums.order_status import OrderStatus
from shared.exceptions import BadRequestException


def test_validate_transition_valid() -> None:
    validate_transition(OrderStatus.PENDING, OrderStatus.ACCEPTED)


def test_validate_transition_invalid() -> None:
    with pytest.raises(InvalidStatusTransitionException):
        validate_transition(OrderStatus.COMPLETED, OrderStatus.ACCEPTED)


def test_as_aware_utc_naive() -> None:
    dt = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
    result = as_aware_utc(dt)
    assert result.tzinfo is not None
    assert result.tzinfo == UTC


def test_as_aware_utc_aware() -> None:
    dt = datetime(2024, 1, 1, 12, 0, 0, tzinfo=UTC)
    result = as_aware_utc(dt)
    assert result == dt


def test_make_request_hash_stable() -> None:
    from features.orders.schemas.order import OrderCreate
    from features.orders.schemas.order_item import OrderItemCreate

    data = OrderCreate(
        restaurant_id=uuid.uuid4(),
        items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1, selected_option_ids=[])],
    )
    h1 = make_request_hash(data)
    h2 = make_request_hash(data)
    assert h1 == h2
    assert len(h1) == 64


def test_is_ordering_paused_false_by_default() -> None:
    restaurant = MagicMock()
    restaurant.is_ordering_paused = False
    assert is_ordering_paused(restaurant) is False


def test_is_ordering_paused_no_until() -> None:
    restaurant = MagicMock()
    restaurant.is_ordering_paused = True
    restaurant.ordering_paused_until = None
    assert is_ordering_paused(restaurant) is True


def test_is_ordering_paused_future_until() -> None:
    restaurant = MagicMock()
    restaurant.is_ordering_paused = True
    restaurant.ordering_paused_until = datetime.now(UTC) + timedelta(hours=1)
    assert is_ordering_paused(restaurant) is True


def test_is_ordering_paused_past_until() -> None:
    restaurant = MagicMock()
    restaurant.is_ordering_paused = True
    restaurant.ordering_paused_until = datetime.now(UTC) - timedelta(hours=1)
    assert is_ordering_paused(restaurant) is False


def test_validate_requested_pickup_at_none() -> None:
    result = validate_requested_pickup_at(None, datetime.now(UTC))
    assert result is None


def test_validate_requested_pickup_at_valid() -> None:
    min_ready = datetime.now(UTC) + timedelta(minutes=10)
    pickup = datetime.now(UTC) + timedelta(minutes=30)
    result = validate_requested_pickup_at(pickup, min_ready)
    assert result == pickup


def test_validate_requested_pickup_at_too_soon() -> None:
    min_ready = datetime.now(UTC) + timedelta(hours=2)
    pickup = datetime.now(UTC) + timedelta(minutes=10)
    with pytest.raises(BadRequestException):
        validate_requested_pickup_at(pickup, min_ready)


def test_validate_requested_pickup_at_too_far() -> None:
    min_ready = datetime.now(UTC) + timedelta(minutes=10)
    pickup = datetime.now(UTC) + timedelta(days=10)
    with pytest.raises(BadRequestException):
        validate_requested_pickup_at(pickup, min_ready)


def _make_wh(
    day_of_week: int, open_time: str, close_time: str, is_closed: bool = False
) -> MagicMock:
    wh = MagicMock()
    wh.day_of_week = day_of_week
    open_h, open_m = (int(p) for p in open_time.split(":"))
    close_h, close_m = (int(p) for p in close_time.split(":"))
    wh.open_time = _time(open_h, open_m)
    wh.close_time = _time(close_h, close_m)
    wh.is_closed = is_closed
    return wh


_FIXED_NOW = datetime(2026, 7, 15, 12, 0, tzinfo=UTC)


def test_is_open_at_no_hours() -> None:
    result = is_open_at([], _FIXED_NOW)
    assert result is None


def test_is_open_at_no_matching_day() -> None:
    other_dow = (_FIXED_NOW.weekday() + 1) % 7
    wh = _make_wh(other_dow, "09:00", "22:00")
    result = is_open_at([wh], _FIXED_NOW)
    assert result is None


def test_is_open_at_closed_flag() -> None:
    wh = _make_wh(_FIXED_NOW.weekday(), "09:00", "22:00", is_closed=True)
    result = is_open_at([wh], _FIXED_NOW)
    assert result is False


def test_is_open_at_within_hours() -> None:
    wh = _make_wh(_FIXED_NOW.weekday(), "09:00", "22:00")
    result = is_open_at([wh], _FIXED_NOW)
    assert result is True


def test_is_open_at_before_opening() -> None:
    wh = _make_wh(_FIXED_NOW.weekday(), "13:00", "22:00")
    result = is_open_at([wh], _FIXED_NOW)
    assert result is False


async def test_safe_publish_redis_failure() -> None:
    mock_cache = MagicMock()
    mock_cache.publish = AsyncMock(side_effect=Exception("redis down"))

    with patch("features.orders.services.order_utils.get_redis_cache", return_value=mock_cache):
        await safe_publish("channel", "msg")
