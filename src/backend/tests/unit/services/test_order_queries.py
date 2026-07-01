import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.services.order_queries import (
    estimate_restaurant_load,
    get_order,
    get_order_events,
    get_restaurant_orders,
    get_user_orders,
)
from features.orders.exceptions import OrderAccessDeniedException, OrderNotFoundException
from features.restaurants.exceptions import RestaurantNotFoundException
from shared.enums.order_status import OrderStatus


def _restaurant(
    *,
    id: uuid.UUID | None = None,
    is_open: bool = True,
    is_ordering_paused: bool = False,
    ordering_paused_until: datetime | None = None,
    avg_prep_time_minutes: int = 15,
    max_active_orders: int | None = None,
):
    r = MagicMock()
    r.id = id or uuid.uuid4()
    r.is_open = is_open
    r.is_ordering_paused = is_ordering_paused
    r.ordering_paused_until = ordering_paused_until
    r.avg_prep_time_minutes = avg_prep_time_minutes
    r.max_active_orders = max_active_orders
    return r


def _order_response():
    o = MagicMock()
    o.id = uuid.uuid4()
    o.user_id = uuid.uuid4()
    o.restaurant_id = uuid.uuid4()
    o.total_price = 500
    o.status = OrderStatus.PENDING
    o.items = []
    return o


@pytest.mark.asyncio
async def test_estimate_load_raises_if_restaurant_not_found():
    with patch(
        "features.restaurants.crud.get_restaurant_by_id",
        new_callable=AsyncMock,
        return_value=None,
    ):
        with pytest.raises(RestaurantNotFoundException):
            await estimate_restaurant_load(AsyncMock(), uuid.uuid4())


@pytest.mark.asyncio
async def test_estimate_load_restaurant_closed():
    restaurant = _restaurant(is_open=False)

    with (
        patch("features.restaurants.crud.get_restaurant_by_id", new_callable=AsyncMock, return_value=restaurant),
        patch("features.orders.crud.order.count_active_orders_by_restaurant_id", new_callable=AsyncMock, return_value=0),
        patch("features.orders.services.order_queries.get_working_hours", new_callable=AsyncMock, return_value=[]),
    ):
        result = await estimate_restaurant_load(AsyncMock(), restaurant.id)

    assert result.ordering_available is False
    assert result.reason == "CLOSED"


@pytest.mark.asyncio
async def test_estimate_load_uses_provided_restaurant():
    restaurant = _restaurant()

    with (
        patch("features.orders.crud.order.count_active_orders_by_restaurant_id", new_callable=AsyncMock, return_value=5),
        patch("features.orders.services.order_queries.get_working_hours", new_callable=AsyncMock, return_value=[]),
    ):
        result = await estimate_restaurant_load(AsyncMock(), restaurant.id, restaurant)

    assert result.ordering_available is True
    assert result.active_orders_count == 5


@pytest.mark.asyncio
async def test_estimate_load_queue_multiplier():
    restaurant = _restaurant(avg_prep_time_minutes=10, max_active_orders=5)

    with (
        patch("features.restaurants.crud.get_restaurant_by_id", new_callable=AsyncMock, return_value=restaurant),
        patch("features.orders.crud.order.count_active_orders_by_restaurant_id", new_callable=AsyncMock, return_value=10),
        patch("features.orders.services.order_queries.get_working_hours", new_callable=AsyncMock, return_value=[]),
    ):
        result = await estimate_restaurant_load(AsyncMock(), restaurant.id)

    assert result.estimated_wait_min_minutes > 10


@pytest.mark.asyncio
async def test_get_user_orders_returns_list():
    order = _order_response()

    with (
        patch("features.orders.crud.order.get_orders_by_user_id", new_callable=AsyncMock, return_value=[order]),
        patch("features.orders.crud.order.count_orders_by_user_id", new_callable=AsyncMock, return_value=1),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=MagicMock()),
    ):
        results, total = await get_user_orders(AsyncMock(), uuid.uuid4())

    assert total == 1
    assert len(results) == 1


@pytest.mark.asyncio
async def test_get_order_raises_if_not_found():
    with patch("features.orders.crud.order.get_order_by_id", new_callable=AsyncMock, return_value=None):
        with pytest.raises(OrderNotFoundException):
            await get_order(AsyncMock(), uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_get_order_raises_if_not_owner():
    order = MagicMock()
    order.user_id = uuid.uuid4()

    with patch("features.orders.crud.order.get_order_by_id", new_callable=AsyncMock, return_value=order):
        with pytest.raises(OrderAccessDeniedException):
            await get_order(AsyncMock(), order.id, uuid.uuid4())


@pytest.mark.asyncio
async def test_get_order_returns_response():
    user_id = uuid.uuid4()
    order = MagicMock()
    order.user_id = user_id
    mock_response = MagicMock()

    with (
        patch("features.orders.crud.order.get_order_by_id", new_callable=AsyncMock, return_value=order),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response),
    ):
        result = await get_order(AsyncMock(), uuid.uuid4(), user_id)

    assert result == mock_response


@pytest.mark.asyncio
async def test_get_restaurant_orders_returns_list():
    order = _order_response()

    with (
        patch("features.orders.crud.order.get_orders_by_restaurant_id", new_callable=AsyncMock, return_value=[order]),
        patch("features.orders.crud.order.count_orders_by_restaurant_id", new_callable=AsyncMock, return_value=1),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=MagicMock()),
    ):
        results, total = await get_restaurant_orders(AsyncMock(), uuid.uuid4())

    assert total == 1


@pytest.mark.asyncio
async def test_get_order_events_returns_list():
    event = MagicMock()

    with (
        patch("features.orders.crud.order.get_events_by_order_id", new_callable=AsyncMock, return_value=[event]),
        patch("features.orders.schemas.order_event.OrderEventResponse.model_validate", return_value=MagicMock()),
    ):
        results = await get_order_events(AsyncMock(), uuid.uuid4())

    assert len(results) == 1
