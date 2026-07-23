import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest

from features.orders.exceptions import (
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    MenuItemUnavailableException,
)
from features.orders.services.order_placement import place_order
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException

from .order_helpers import make_menu_item, make_order_data, make_restaurant


async def test_place_order_restaurant_not_found() -> None:
    data = make_order_data()

    with (
        patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ),
        patch(
            "features.orders.services.order_placement.start_idempotency_record",
            new_callable=AsyncMock,
            return_value=None,
        ),
        pytest.raises(RestaurantNotFoundException),
    ):
        await place_order(AsyncMock(), data, uuid.uuid4())


async def test_place_order_restaurant_closed() -> None:
    restaurant = make_restaurant(is_open=False)
    data = make_order_data(restaurant_id=restaurant.id)

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
        pytest.raises(RestaurantClosedException),
    ):
        await place_order(AsyncMock(), data, uuid.uuid4())


async def test_place_order_ordering_paused() -> None:
    restaurant = make_restaurant(is_open=True, is_ordering_paused=True)
    restaurant.ordering_paused_until = datetime.now(UTC) + timedelta(hours=1)
    data = make_order_data(restaurant_id=restaurant.id)

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
        pytest.raises(RestaurantClosedException),
    ):
        await place_order(AsyncMock(), data, uuid.uuid4())


async def test_place_order_menu_items_not_found() -> None:
    restaurant = make_restaurant()
    data = make_order_data(restaurant_id=restaurant.id)

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
        pytest.raises(MenuItemsNotFoundException),
    ):
        await place_order(AsyncMock(), data, uuid.uuid4())


async def test_place_order_menu_item_restaurant_mismatch() -> None:
    restaurant = make_restaurant()
    data = make_order_data(restaurant_id=restaurant.id)
    item_id = data.items[0].menu_item_id

    mi = make_menu_item(uuid.uuid4())
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
        pytest.raises(MenuItemRestaurantMismatchException),
    ):
        await place_order(AsyncMock(), data, uuid.uuid4())


async def test_place_order_menu_item_unavailable() -> None:
    restaurant = make_restaurant()
    data = make_order_data(restaurant_id=restaurant.id)
    item_id = data.items[0].menu_item_id

    mi = make_menu_item(restaurant.id, available=False)
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
        pytest.raises(MenuItemUnavailableException),
    ):
        await place_order(AsyncMock(), data, uuid.uuid4())


async def test_place_order_soft_deleted_menu_item_rejected() -> None:
    restaurant = make_restaurant()
    data = make_order_data(restaurant_id=restaurant.id)

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
        pytest.raises(MenuItemsNotFoundException),
    ):
        await place_order(AsyncMock(), data, uuid.uuid4())
