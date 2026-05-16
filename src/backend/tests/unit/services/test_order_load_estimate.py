import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.services.order import estimate_restaurant_load


def _restaurant(
    *,
    is_open: bool = True,
    is_ordering_paused: bool = False,
    ordering_paused_until: datetime | None = None,
    avg_prep_time_minutes: int = 15,
    max_active_orders: int | None = None,
):
    restaurant = MagicMock()
    restaurant.id = uuid.uuid4()
    restaurant.is_open = is_open
    restaurant.is_ordering_paused = is_ordering_paused
    restaurant.ordering_paused_until = ordering_paused_until
    restaurant.avg_prep_time_minutes = avg_prep_time_minutes
    restaurant.max_active_orders = max_active_orders
    return restaurant


@pytest.mark.asyncio
async def test_estimate_restaurant_load_warns_with_later_window():
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
            "features.orders.services.order.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
    ):
        estimate = await estimate_restaurant_load(AsyncMock(), restaurant.id)

    assert estimate.ordering_available is True
    assert estimate.active_orders_count == 42
    assert estimate.estimated_wait_min_minutes == 30
    assert estimate.estimated_wait_max_minutes == 40


@pytest.mark.asyncio
async def test_estimate_restaurant_load_respects_manual_pause():
    paused_until = datetime.now(timezone.utc) + timedelta(minutes=30)
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
            "features.orders.services.order.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
    ):
        estimate = await estimate_restaurant_load(AsyncMock(), restaurant.id)

    assert estimate.ordering_available is False
    assert estimate.reason == "PAUSED"
    assert estimate.paused_until == paused_until
