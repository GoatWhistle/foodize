import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.services.order_utils import (
    _as_aware_utc,
    _is_open_at,
    _is_ordering_paused,
    _make_request_hash,
    _validate_requested_pickup_at,
    _validate_transition,
)
from features.orders.exceptions import InvalidStatusTransitionException
from shared.enums.order_status import OrderStatus
from shared.exceptions import BadRequestException


def test_validate_transition_valid():
    _validate_transition(OrderStatus.PENDING, OrderStatus.ACCEPTED)


def test_validate_transition_invalid():
    with pytest.raises(InvalidStatusTransitionException):
        _validate_transition(OrderStatus.COMPLETED, OrderStatus.ACCEPTED)


def test_as_aware_utc_naive():
    dt = datetime(2024, 1, 1, 12, 0, 0)
    result = _as_aware_utc(dt)
    assert result.tzinfo is not None
    assert result.tzinfo == timezone.utc


def test_as_aware_utc_aware():
    dt = datetime(2024, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    result = _as_aware_utc(dt)
    assert result == dt


def test_make_request_hash_stable():
    from features.orders.schemas.order import OrderCreate, OrderItemCreate

    data = OrderCreate(
        restaurant_id=uuid.uuid4(),
        items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1, selected_option_ids=[])],
    )
    h1 = _make_request_hash(data)
    h2 = _make_request_hash(data)
    assert h1 == h2
    assert len(h1) == 64


def test_is_ordering_paused_false_by_default():
    restaurant = MagicMock()
    restaurant.is_ordering_paused = False
    assert _is_ordering_paused(restaurant) is False


def test_is_ordering_paused_no_until():
    restaurant = MagicMock()
    restaurant.is_ordering_paused = True
    restaurant.ordering_paused_until = None
    assert _is_ordering_paused(restaurant) is True


def test_is_ordering_paused_future_until():
    restaurant = MagicMock()
    restaurant.is_ordering_paused = True
    restaurant.ordering_paused_until = datetime.now(timezone.utc) + timedelta(hours=1)
    assert _is_ordering_paused(restaurant) is True


def test_is_ordering_paused_past_until():
    restaurant = MagicMock()
    restaurant.is_ordering_paused = True
    restaurant.ordering_paused_until = datetime.now(timezone.utc) - timedelta(hours=1)
    assert _is_ordering_paused(restaurant) is False



def test_validate_requested_pickup_at_none():
    result = _validate_requested_pickup_at(None, datetime.now(timezone.utc))
    assert result is None


def test_validate_requested_pickup_at_valid():
    min_ready = datetime.now(timezone.utc) + timedelta(minutes=10)
    pickup = datetime.now(timezone.utc) + timedelta(minutes=30)
    result = _validate_requested_pickup_at(pickup, min_ready)
    assert result == pickup


def test_validate_requested_pickup_at_too_soon():
    min_ready = datetime.now(timezone.utc) + timedelta(hours=2)
    pickup = datetime.now(timezone.utc) + timedelta(minutes=10)
    with pytest.raises(BadRequestException):
        _validate_requested_pickup_at(pickup, min_ready)


def test_validate_requested_pickup_at_too_far():
    min_ready = datetime.now(timezone.utc) + timedelta(minutes=10)
    pickup = datetime.now(timezone.utc) + timedelta(days=10)
    with pytest.raises(BadRequestException):
        _validate_requested_pickup_at(pickup, min_ready)


def _make_wh(day_of_week: int, open_time: str, close_time: str, is_closed: bool = False):
    wh = MagicMock()
    wh.day_of_week = day_of_week
    wh.open_time = open_time
    wh.close_time = close_time
    wh.is_closed = is_closed
    return wh


def test_is_open_at_no_hours():
    result = _is_open_at([], datetime.now(timezone.utc))
    assert result is None


def test_is_open_at_no_matching_day():
    now = datetime.now(timezone.utc)
    other_dow = (now.weekday() + 1) % 7
    wh = _make_wh(other_dow, "09:00", "22:00")
    result = _is_open_at([wh], now)
    assert result is None


def test_is_open_at_closed_flag():
    now = datetime.now(timezone.utc)
    wh = _make_wh(now.weekday(), "00:00", "23:59", is_closed=True)
    result = _is_open_at([wh], now)
    assert result is False


def test_is_open_at_within_hours():
    now = datetime.now(timezone.utc)
    dow = now.weekday()
    wh = _make_wh(dow, "00:00", "23:59")
    result = _is_open_at([wh], now)
    assert result is True


@pytest.mark.asyncio
async def test_safe_publish_redis_failure():
    from features.orders.services.order_utils import _safe_publish

    mock_cache = MagicMock()
    mock_cache.publish = AsyncMock(side_effect=Exception("redis down"))

    with patch("features.orders.services.order_utils.get_redis_cache", return_value=mock_cache):
        await _safe_publish("channel", "msg")
