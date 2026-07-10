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

from features.orders.schemas.order import OrderCreate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import place_order
from shared.exceptions import BadRequestException


class TestPlaceOrderOptions:
    async def test_selected_options_are_validated_and_passed_to_create_order(self, mock_db_session):
        user = make_user()
        item_id = uuid.uuid4()
        option_id = uuid.uuid4()
        group_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[
                OrderItemCreate(
                    menu_item_id=item_id,
                    quantity=2,
                    selected_option_ids=[option_id],
                )
            ],
        )
        mock_order = make_mock_order(uuid.uuid4(), user.id)
        mock_menu_item = make_mock_menu_item(item_id, price=300, restaurant_id=restaurant_id)
        mock_group = MagicMock()
        mock_group.id = group_id
        mock_group.name = "Extras"
        mock_group.menu_item_id = item_id
        mock_group.selection_type = "multiple"
        mock_group.is_required = False
        mock_group.min_selected = 0
        mock_group.max_selected = 2
        mock_group.is_active = True
        mock_menu_item.option_groups = [mock_group]
        mock_option = MagicMock()
        mock_option.id = option_id
        mock_option.group_id = group_id
        mock_option.name = "Cheese"
        mock_option.price_delta = 50
        mock_option.is_available = True
        mock_option.group = mock_group
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
                return_value={option_id: mock_option},
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
                "features.orders.services.order_queries.estimate_restaurant_load",
                new_callable=AsyncMock,
                return_value=make_load_estimate(restaurant_id),
            ),
            patch(
                "features.orders.services.order_placement._create_order",
                new_callable=AsyncMock,
                return_value=mock_order,
            ) as create_order_mock,
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
            await place_order(mock_db_session, order_data, user.id)

        selected_options_by_item = create_order_mock.call_args.args[4]
        assert selected_options_by_item[0] == [mock_option]

    async def test_selected_option_from_other_item_rejected(self, mock_db_session):
        item_id = uuid.uuid4()
        option_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=item_id, selected_option_ids=[option_id])],
        )
        mock_menu_item = make_mock_menu_item(item_id, restaurant_id=restaurant_id)
        mock_menu_item.option_groups = []
        mock_group = MagicMock()
        mock_group.menu_item_id = uuid.uuid4()
        mock_group.is_active = True
        mock_option = MagicMock()
        mock_option.id = option_id
        mock_option.group_id = uuid.uuid4()
        mock_option.is_available = True
        mock_option.group = mock_group

        with (
            patch(
                "features.restaurants.crud.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.crud.order_item.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id: mock_menu_item},
            ),
            patch(
                "features.orders.crud.order_item.get_options_by_ids",
                new_callable=AsyncMock,
                return_value={option_id: mock_option},
            ),
            patch(
                "features.orders.services.order_placement.get_working_hours",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            with pytest.raises(BadRequestException):
                await place_order(mock_db_session, order_data, uuid.uuid4())
