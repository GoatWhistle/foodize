import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from factories import make_user
from fastapi import HTTPException

from features.orders.schemas import OrderCreate, OrderItemCreate
from features.orders.service import get_order_for_user, get_user_orders, place_order


def make_mock_menu_item(item_id: uuid.UUID, price: int = 500):
    item = MagicMock()
    item.id = item_id
    item.price = price
    return item


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
        mock_menu_item = make_mock_menu_item(item_id, price=300)

        with (
            patch(
                "features.orders.service.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={item_id: mock_menu_item},
            ),
            patch(
                "features.orders.service.create_order_in_db",
                new_callable=AsyncMock,
                return_value=mock_order,
            ) as mock_create,
        ):
            result = await place_order(mock_db_session, order_data, user.id)

        assert result is mock_order
        mock_create.assert_awaited_once()

    async def test_place_order_missing_menu_items_raises_422(self, mock_db_session):
        item_id_1 = uuid.uuid4()
        item_id_2 = uuid.uuid4()
        order_data = OrderCreate(
            restaurant_id=uuid.uuid4(),
            items=[
                OrderItemCreate(menu_item_id=item_id_1, quantity=1),
                OrderItemCreate(menu_item_id=item_id_2, quantity=1),
            ],
        )
        with patch(
            "features.orders.service.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={item_id_1: make_mock_menu_item(item_id_1)},
        ):
            with pytest.raises(HTTPException) as exc_info:
                await place_order(mock_db_session, order_data, uuid.uuid4())

        assert exc_info.value.status_code == 422

    async def test_place_order_all_items_missing(self, mock_db_session):
        order_data = OrderCreate(
            restaurant_id=uuid.uuid4(),
            items=[OrderItemCreate(menu_item_id=uuid.uuid4(), quantity=1)],
        )
        with patch(
            "features.orders.service.get_menu_items_by_ids",
            new_callable=AsyncMock,
            return_value={},
        ):
            with pytest.raises(HTTPException) as exc_info:
                await place_order(mock_db_session, order_data, uuid.uuid4())

        assert exc_info.value.status_code == 422

    async def test_place_order_empty_items(self, mock_db_session):
        order_data = OrderCreate(restaurant_id=uuid.uuid4(), items=[])
        mock_order = make_mock_order(uuid.uuid4(), uuid.uuid4())

        with (
            patch(
                "features.orders.service.get_menu_items_by_ids",
                new_callable=AsyncMock,
                return_value={},
            ),
            patch(
                "features.orders.service.create_order_in_db",
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
            "features.orders.service.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            result = await get_order_for_user(mock_db_session, order_id, user_id)

        assert result is mock_order

    async def test_get_order_not_found_raises_404(self, mock_db_session):
        with patch(
            "features.orders.service.get_order_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_order_for_user(mock_db_session, uuid.uuid4(), uuid.uuid4())

        assert exc_info.value.status_code == 404

    async def test_get_order_wrong_user_raises_403(self, mock_db_session):
        owner_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, owner_id)

        with patch(
            "features.orders.service.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            with pytest.raises(HTTPException) as exc_info:
                await get_order_for_user(mock_db_session, order_id, other_user_id)

        assert exc_info.value.status_code == 403


class TestGetUserOrders:
    async def test_returns_list(self, mock_db_session):
        user_id = uuid.uuid4()
        orders = [make_mock_order(uuid.uuid4(), user_id) for _ in range(3)]

        with patch(
            "features.orders.service.get_orders_by_user_id",
            new_callable=AsyncMock,
            return_value=orders,
        ):
            result = await get_user_orders(mock_db_session, user_id)

        assert len(result) == 3

    async def test_returns_empty_list(self, mock_db_session):
        with patch(
            "features.orders.service.get_orders_by_user_id",
            new_callable=AsyncMock,
            return_value=[],
        ):
            result = await get_user_orders(mock_db_session, uuid.uuid4())

        assert result == []
