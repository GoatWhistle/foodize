import uuid
from unittest.mock import AsyncMock, patch

import pytest
from orders_service_helpers import make_mock_order

from features.orders.exceptions import (
    OrderAccessDeniedException,
    OrderNotFoundException,
)
from features.orders.schemas.order import OrderResponse
from features.orders.services.order import get_order, get_user_orders


class TestGetOrder:
    async def test_get_order_success(self, mock_db_session):
        user_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, user_id)

        with patch(
            "features.orders.crud.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            result = await get_order(mock_db_session, order_id, user_id)

        assert isinstance(result, OrderResponse)
        assert result.id == order_id

    async def test_get_order_not_found_raises_404(self, mock_db_session):
        with patch(
            "features.orders.crud.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(OrderNotFoundException):
                await get_order(mock_db_session, uuid.uuid4(), uuid.uuid4())

    async def test_get_order_wrong_user_raises_403(self, mock_db_session):
        owner_id = uuid.uuid4()
        other_user_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, owner_id)

        with patch(
            "features.orders.crud.order.get_order_by_id",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            with pytest.raises(OrderAccessDeniedException):
                await get_order(mock_db_session, order_id, other_user_id)


class TestGetUserOrders:
    async def test_returns_list(self, mock_db_session):
        user_id = uuid.uuid4()
        orders = [make_mock_order(uuid.uuid4(), user_id) for _ in range(3)]

        with (
            patch(
                "features.orders.crud.order.get_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=orders,
            ),
            patch(
                "features.orders.crud.order.count_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=3,
            ),
        ):
            data, total = await get_user_orders(mock_db_session, user_id)

        assert len(data) == 3
        assert total == 3
        assert all(isinstance(o, OrderResponse) for o in data)

    async def test_returns_empty_list(self, mock_db_session):
        with (
            patch(
                "features.orders.crud.order.get_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.orders.crud.order.count_orders_by_user_id",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            data, total = await get_user_orders(mock_db_session, uuid.uuid4())

        assert data == []
        assert total == 0
