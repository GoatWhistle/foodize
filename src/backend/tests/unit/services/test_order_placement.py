import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.exceptions import (
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    MenuItemUnavailableException,
)
from features.orders.schemas.order import OrderCreate, OrderItemCreate
from features.orders.services.order_placement import place_order
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException


def _make_order_data(restaurant_id=None, **kwargs):
    rid = restaurant_id or uuid.uuid4()
    item_id = uuid.uuid4()
    return OrderCreate(
        restaurant_id=rid,
        items=[OrderItemCreate(menu_item_id=item_id, quantity=1, selected_option_ids=[])],
        **kwargs,
    )


def _make_restaurant(is_open=True, is_ordering_paused=False):
    r = MagicMock()
    r.id = uuid.uuid4()
    r.name = "Test"
    r.is_open = is_open
    r.is_ordering_paused = is_ordering_paused
    r.ordering_paused_until = None
    r.avg_prep_time_minutes = 15
    r.max_active_orders = None
    return r


def _menu_item(restaurant_id, available=True):
    mi = MagicMock()
    mi.id = uuid.uuid4()
    mi.restaurant_id = restaurant_id
    mi.is_available = available
    mi.price = 100
    return mi


@pytest.mark.asyncio
async def test_place_order_restaurant_not_found():
    data = _make_order_data()

    with patch(
        "features.restaurants.crud.get_restaurant_by_id", new_callable=AsyncMock, return_value=None
    ):
        with patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(RestaurantNotFoundException):
                await place_order(AsyncMock(), data, uuid.uuid4())


@pytest.mark.asyncio
async def test_place_order_restaurant_closed():
    restaurant = _make_restaurant(is_open=False)
    data = _make_order_data(restaurant_id=restaurant.id)

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
    ):
        with pytest.raises(RestaurantClosedException):
            await place_order(AsyncMock(), data, uuid.uuid4())


@pytest.mark.asyncio
async def test_place_order_ordering_paused():
    restaurant = _make_restaurant(is_open=True, is_ordering_paused=True)
    restaurant.ordering_paused_until = datetime.now(timezone.utc) + timedelta(hours=1)
    data = _make_order_data(restaurant_id=restaurant.id)

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
    ):
        with pytest.raises(RestaurantClosedException):
            await place_order(AsyncMock(), data, uuid.uuid4())


@pytest.mark.asyncio
async def test_place_order_menu_items_not_found():
    restaurant = _make_restaurant()
    data = _make_order_data(restaurant_id=restaurant.id)

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.services.order_placement.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "features.orders.crud.order_item.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={},
        ),
    ):
        with pytest.raises(MenuItemsNotFoundException):
            await place_order(AsyncMock(), data, uuid.uuid4())


@pytest.mark.asyncio
async def test_place_order_menu_item_restaurant_mismatch():
    restaurant = _make_restaurant()
    data = _make_order_data(restaurant_id=restaurant.id)
    item_id = data.items[0].menu_item_id

    mi = _menu_item(uuid.uuid4())
    mi.id = item_id

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.services.order_placement.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "features.orders.crud.order_item.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={item_id: mi},
        ),
    ):
        with pytest.raises(MenuItemRestaurantMismatchException):
            await place_order(AsyncMock(), data, uuid.uuid4())


@pytest.mark.asyncio
async def test_place_order_menu_item_unavailable():
    restaurant = _make_restaurant()
    data = _make_order_data(restaurant_id=restaurant.id)
    item_id = data.items[0].menu_item_id

    mi = _menu_item(restaurant.id, available=False)
    mi.id = item_id

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.services.order_placement.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "features.orders.crud.order_item.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={item_id: mi},
        ),
    ):
        with pytest.raises(MenuItemUnavailableException):
            await place_order(AsyncMock(), data, uuid.uuid4())


@pytest.mark.asyncio
async def test_place_order_soft_deleted_menu_item_rejected():
    restaurant = _make_restaurant()
    data = _make_order_data(restaurant_id=restaurant.id)

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.services.order_placement.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "features.orders.crud.order_item.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={},
        ),
    ):
        with pytest.raises(MenuItemsNotFoundException):
            await place_order(AsyncMock(), data, uuid.uuid4())


@pytest.mark.asyncio
async def test_place_order_idempotency_hit():
    restaurant = _make_restaurant()
    data = _make_order_data(restaurant_id=restaurant.id)
    mock_response = MagicMock()
    mock_response.response_json = {"id": str(uuid.uuid4())}

    idempotency_record = MagicMock()
    idempotency_record.response_json = mock_response.response_json

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=idempotency_record,
        ),
        patch(
            "features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response
        ),
    ):
        result = await place_order(AsyncMock(), data, uuid.uuid4(), idempotency_key="key123")

    assert result == mock_response


@pytest.mark.asyncio
async def test_place_order_success():
    restaurant = _make_restaurant()
    data = _make_order_data(restaurant_id=restaurant.id)
    item_id = data.items[0].menu_item_id

    mi = _menu_item(restaurant.id)
    mi.id = item_id
    mi.option_groups = []

    order_id = uuid.uuid4()
    user_id_val = uuid.uuid4()
    mock_order = MagicMock()
    mock_order.id = order_id
    mock_order.user_id = user_id_val
    mock_order.restaurant_id = restaurant.id
    mock_order.display_id = "1001"
    mock_order.total_price = 100

    mock_load = MagicMock()
    mock_load.estimated_wait_min_minutes = 15
    mock_load.estimated_wait_max_minutes = 30

    mock_response = MagicMock()

    session = AsyncMock()
    session.add = MagicMock()
    session.add_all = MagicMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()

    with (
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=restaurant,
        ),
        patch(
            "features.orders.services.order_placement.get_working_hours",
            new_callable=AsyncMock,
            return_value=[],
        ),
        patch(
            "features.orders.crud.order_item.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={item_id: mi},
        ),
        patch(
            "features.orders.crud.order_item.get_options_by_ids",
            new_callable=AsyncMock,
            return_value={},
        ),
        patch(
            "features.orders.crud.order.count_orders_by_user_id",
            new_callable=AsyncMock,
            return_value=0,
        ),
        patch(
            "features.orders.services.order_placement.estimate_restaurant_load",
            new_callable=AsyncMock,
            return_value=mock_load,
        ),
        patch(
            "features.orders.crud.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils.safe_publish", new_callable=AsyncMock),
        patch(
            "features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response
        ),
        patch("features.orders.services.order_placement.Order", return_value=mock_order),
        patch("features.orders.services.order_placement.OrderItem", return_value=MagicMock()),
    ):
        result = await place_order(session, data, uuid.uuid4())

    assert result == mock_response
