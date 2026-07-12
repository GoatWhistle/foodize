import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from orders_service_helpers import make_mock_order

from features.orders.exceptions import (
    OrderAccessDeniedException,
    OrderNotCancellableException,
    OrderNotFoundException,
)
from features.orders.schemas.order import OrderCancelRequest, OrderResponse
from features.orders.services.order import cancel_order
from shared.enums.order_status import OrderStatus


class TestCancelOrder:
    async def test_cancel_pending_success(self, mock_db_session: AsyncMock) -> None:
        user_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, user_id, OrderStatus.PENDING.value)
        cancelled = make_mock_order(order_id, user_id, OrderStatus.CANCELLED.value)

        with (
            patch(
                "features.orders.crud.order.get_order_by_identifier_for_update",
                new_callable=AsyncMock,
                return_value=mock_order,
            ),
            patch(
                "features.orders.crud.order.update_order_status",
                new_callable=AsyncMock,
                return_value=cancelled,
            ) as mock_cancel,
            patch(
                "features.orders.crud.order.create_order_event",
                new_callable=AsyncMock,
            ),
            patch(
                "features.orders.services.order_status.enqueue_event",
                new_callable=AsyncMock,
            ),
            patch(
                "features.orders.services.order_utils.get_redis_cache",
                return_value=MagicMock(publish=AsyncMock()),
            ),
        ):
            result = await cancel_order(mock_db_session, order_id, user_id, OrderCancelRequest())

        mock_cancel.assert_awaited_once()
        assert isinstance(result, OrderResponse)

    async def test_cancel_wrong_user_raises(self, mock_db_session: AsyncMock) -> None:
        owner_id = uuid.uuid4()
        other_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, owner_id, OrderStatus.PENDING.value)

        with patch(
            "features.orders.crud.order.get_order_by_identifier_for_update",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            with pytest.raises(OrderAccessDeniedException):
                await cancel_order(mock_db_session, order_id, other_id, OrderCancelRequest())

    async def test_cancel_non_pending_raises(self, mock_db_session: AsyncMock) -> None:
        user_id = uuid.uuid4()
        order_id = uuid.uuid4()
        mock_order = make_mock_order(order_id, user_id, OrderStatus.COMPLETED.value)

        with patch(
            "features.orders.crud.order.get_order_by_identifier_for_update",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            with pytest.raises(OrderNotCancellableException):
                await cancel_order(mock_db_session, order_id, user_id, OrderCancelRequest())

    async def test_cancel_not_found_raises(self, mock_db_session: AsyncMock) -> None:
        with patch(
            "features.orders.crud.order.get_order_by_identifier_for_update",
            new_callable=AsyncMock,
            return_value=None,
        ):
            with pytest.raises(OrderNotFoundException):
                await cancel_order(
                    mock_db_session, uuid.uuid4(), uuid.uuid4(), OrderCancelRequest()
                )
