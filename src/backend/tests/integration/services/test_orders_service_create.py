import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from factories import make_user
from orders_service_helpers import (
    make_load_estimate,
    make_mock_menu_item,
    make_mock_order,
    make_mock_restaurant,
)
from pydantic import ValidationError

from features.orders.exceptions import (
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
)
from features.orders.schemas.order import OrderCreate, OrderResponse
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import place_order
from features.restaurants.exceptions import (
    RestaurantClosedException,
    RestaurantNotFoundException,
)


class TestPlaceOrder:
    async def test_place_order_success(self, mock_db_session: AsyncMock) -> None:
        user = make_user()
        item_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=item_id, quantity=2)],
        )
        mock_order = make_mock_order(uuid.uuid4(), user.id)
        mock_menu_item = make_mock_menu_item(item_id, price=300, restaurant_id=restaurant_id)
        mock_restaurant = make_mock_restaurant(restaurant_id)
        mock_restaurant.name = "Test Restaurant"

        with (
            patch(
                "features.restaurants.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=mock_restaurant,
            ),
            patch(
                "features.orders.crud.order_item.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id: mock_menu_item},
            ),
            patch(
                "features.orders.crud.order_item.get_options_by_ids",
                new_callable=AsyncMock,
                return_value={},
            ),
            patch(
                "features.orders.services.order_placement.get_working_hours",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.orders.crud.order.count_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=0,
            ),
            patch(
                "features.orders.services.order_placement.estimate_restaurant_load",
                new_callable=AsyncMock,
                return_value=make_load_estimate(restaurant_id),
            ),
            patch(
                "features.orders.services.order_placement._create_order",
                new_callable=AsyncMock,
                return_value=mock_order,
            ),
            patch(
                "features.orders.crud.order.get_order_by_id",
                new_callable=AsyncMock,
                return_value=mock_order,
            ),
            patch(
                "features.orders.services.order_placement.enqueue_event",
                new_callable=AsyncMock,
            ),
            patch(
                "features.orders.services.order_utils.get_redis_cache",
                return_value=MagicMock(publish=AsyncMock()),
            ),
        ):
            result = await place_order(mock_db_session, order_data, user.id)

        assert isinstance(result, OrderResponse)
        assert result.id == mock_order.id

    async def test_place_order_restaurant_not_found(self, mock_db_session: AsyncMock) -> None:
        order_data = OrderCreate(
            restaurant_id=uuid.uuid4(),
            items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1)],
        )
        with patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(RestaurantNotFoundException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_restaurant_closed(self, mock_db_session: AsyncMock) -> None:
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1)],
        )
        with patch(
            "features.restaurants.crud.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=make_mock_restaurant(restaurant_id, is_open=False),
        ):
            with pytest.raises(RestaurantClosedException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_item_wrong_restaurant(self, mock_db_session: AsyncMock) -> None:
        restaurant_id = uuid.uuid4()
        item_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=item_id, quantity=1)],
        )
        wrong_restaurant_item = make_mock_menu_item(item_id, restaurant_id=uuid.uuid4())

        with (
            patch(
                "features.restaurants.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.crud.order_item.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id: wrong_restaurant_item},
            ),
            patch(
                "features.orders.services.order_placement.get_working_hours",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            with pytest.raises(MenuItemRestaurantMismatchException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_missing_menu_items_raises_422(
        self, mock_db_session: AsyncMock
    ) -> None:
        restaurant_id = uuid.uuid4()
        item_id_1 = uuid.uuid4()
        item_id_2 = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[
                OrderItemCreate(menu_item_id=item_id_1, quantity=1),
                OrderItemCreate(menu_item_id=item_id_2, quantity=1),
            ],
        )
        with (
            patch(
                "features.restaurants.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.crud.order_item.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id_1: make_mock_menu_item(item_id_1)},
            ),
            patch(
                "features.orders.services.order_placement.get_working_hours",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            with pytest.raises(MenuItemsNotFoundException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_all_items_missing(self, mock_db_session: AsyncMock) -> None:
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1)],
        )
        with (
            patch(
                "features.restaurants.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.crud.order_item.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={},
            ),
            patch(
                "features.orders.services.order_placement.get_working_hours",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            with pytest.raises(MenuItemsNotFoundException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_empty_items(self, mock_db_session: AsyncMock) -> None:
        restaurant_id = uuid.uuid4()
        with pytest.raises(ValidationError):
            OrderCreate(restaurant_id=restaurant_id, items=[])
