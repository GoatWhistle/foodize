import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from factories import make_user

from features.orders.exceptions import (
    MenuItemRestaurantMismatchException,
    MenuItemsNotFoundException,
    OrderAccessDeniedException,
    OrderNotCancellableException,
    OrderNotFoundException,
)
from features.orders.schemas.order import OrderCreate
from features.orders.schemas.order_item import OrderItemCreate
from features.orders.services.order import (
    cancel_customer_order,
    get_order_for_user,
    get_user_orders,
    place_order,
)
from features.restaurants.exceptions import RestaurantClosedException, RestaurantNotFoundException
from shared.enums.order_status import OrderStatus


def make_mock_menu_item(
    item_id: uuid.UUID, price: int = 500, restaurant_id: uuid.UUID | None = None
):
    item = MagicMock()
    item.id = item_id
    item.price = price
    item.restaurant_id = restaurant_id or uuid.uuid4()
    return item


def make_mock_restaurant(restaurant_id: uuid.UUID, is_open: bool = True):
    r = MagicMock()
    r.id = restaurant_id
    r.is_open = is_open
    return r


def make_mock_order(order_id: uuid.UUID, user_id: uuid.UUID):
    order = MagicMock()
    order.id = order_id
    order.user_id = user_id
    return order


class TestPlaceOrder:
    async def test_place_order_success(self, mock_db_session):
        user = make_user()
        item_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=item_id, quantity=2)],
        )
        mock_order = make_mock_order(uuid.uuid4(), user.id)
        mock_menu_item = make_mock_menu_item(item_id, price=300, restaurant_id=restaurant_id)

        with (
            patch(
                "features.orders.services.order.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.services.order.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id: mock_menu_item},
            ),
            patch(
                "features.orders.services.order._create_order",
                new_callable=AsyncMock,
                return_value=mock_order,
            ) as mock_create,
        ):
            result = await place_order(mock_db_session, order_data, user.id)

        assert result is mock_order
        mock_create.assert_awaited_once()

    async def test_place_order_restaurant_not_found(self, mock_db_session):
        order_data = OrderCreate(
            restaurant_id=uuid.uuid4(),
            items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1)],
        )
        with patch(
            "features.orders.services.order.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(RestaurantNotFoundException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_restaurant_closed(self, mock_db_session):
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1)],
        )
        with patch(
            "features.orders.services.order.get_restaurant_by_id",
            new_callable=AsyncMock,
            return_value=make_mock_restaurant(restaurant_id, is_open=False),
        ):
            with pytest.raises(RestaurantClosedException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_item_wrong_restaurant(self, mock_db_session):
        restaurant_id = uuid.uuid4()
        item_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=item_id, quantity=1)],
        )
        wrong_restaurant_item = make_mock_menu_item(item_id, restaurant_id=uuid.uuid4())

        with (
            patch(
                "features.orders.services.order.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.services.order.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id: wrong_restaurant_item},
            ),
        ):
            with pytest.raises(MenuItemRestaurantMismatchException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_missing_menu_items_raises_422(self, mock_db_session):
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
                "features.orders.services.order.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.services.order.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id_1: make_mock_menu_item(item_id_1)},
            ),
        ):
            with pytest.raises(MenuItemsNotFoundException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_all_items_missing(self, mock_db_session):
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=restaurant_id,
            items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1)],
        )
        with (
            patch(
                "features.orders.services.order.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.services.order.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={},
            ),
        ):
            with pytest.raises(MenuItemsNotFoundException):
                await place_order(mock_db_session, order_data, uuid.uuid4())

    async def test_place_order_empty_items(self, mock_db_session):
        restaurant_id = uuid.uuid4()
        order_data = OrderCreate(restaurant_id=restaurant_id, items=[])
        mock_order = make_mock_order(uuid.uuid4(), uuid.uuid4())

        with (
            patch(
                "features.orders.services.order.get_restaurant_by_id",
                new_callable=AsyncMock,
                return_value=make_mock_restaurant(restaurant_id),
            ),
            patch(
                "features.orders.services.order.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={},
            ),
            patch(
                "features.orders.services.order._create_order",
                new_callable=AsyncMock,
                return_value=mock_order,
            ),
        ):
            result = await place_order(mock_db_session, order_data, uuid.uuid4())

        assert result is mock_order


class TestGetOrderForUser:
    async def test_get_order_success(self, mock_db_session):
        user_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, user_id)

        with patch(
            "features.orders.services.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            result = await get_order_for_user(mock_db_session, order_id, user_id)

        assert result is mock_order

    async def test_get_order_not_found_raises_404(self, mock_db_session):
        with patch(
            "features.orders.services.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(OrderNotFoundException):
                await get_order_for_user(mock_db_session, uuid.uuid4(), uuid.uuid4())

    async def test_get_order_wrong_user_raises_403(self, mock_db_session):
        owner_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, owner_id)

        with patch(
            "features.orders.services.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            with pytest.raises(OrderAccessDeniedException):
                await get_order_for_user(mock_db_session, order_id, other_user_id)


class TestGetUserOrders:
    async def test_returns_list(self, mock_db_session):
        user_id = uuid.uuid4()
        orders = [make_mock_order(uuid.uuid4(), user_id) for _ in range(3)]

        with (
            patch(
                "features.orders.services.order.get_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=orders,
            ),
            patch(
                "features.orders.services.order.count_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=3,
            ),
        ):
            data, total = await get_user_orders(mock_db_session, user_id)

        assert len(data) == 3
        assert total == 3

    async def test_returns_empty_list(self, mock_db_session):
        with (
            patch(
                "features.orders.services.order.get_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.orders.services.order.count_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            data, total = await get_user_orders(mock_db_session, uuid.uuid4())

        assert data == []
        assert total == 0


class TestCancelCustomerOrder:
    def make_mock_order(self, user_id: uuid.UUID, status: OrderStatus = OrderStatus.PENDING):
        order = MagicMock()
        order.id = uuid.uuid4()
        order.user_id = user_id
        order.status = status
        return order

    async def test_cancel_pending_success(self, mock_db_session):
        user_id = uuid.uuid4()
        mock_order = self.make_mock_order(user_id, OrderStatus.PENDING)

        with patch(
            "features.orders.services.order.cancel_order",
            new_callable=AsyncMock,
            return_value=mock_order,
        ) as mock_cancel:
            result = await cancel_customer_order(mock_db_session, mock_order, user_id)

        mock_cancel.assert_awaited_once_with(mock_db_session, mock_order)
        assert result is mock_order

    async def test_cancel_wrong_user_raises(self, mock_db_session):
        owner_id = uuid.uuid4()
        other_id = uuid.uuid4()
        mock_order = self.make_mock_order(owner_id, OrderStatus.PENDING)

        with pytest.raises(OrderAccessDeniedException):
            await cancel_customer_order(mock_db_session, mock_order, other_id)

    async def test_cancel_non_pending_raises(self, mock_db_session):
        user_id = uuid.uuid4()
        mock_order = self.make_mock_order(user_id, OrderStatus.ACCEPTED)

        with pytest.raises(OrderNotCancellableException):
            await cancel_customer_order(mock_db_session, mock_order, user_id)
