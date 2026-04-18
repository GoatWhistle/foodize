import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from factories import make_user

from features.orders.exceptions import InvalidStatusTransitionException
from features.orders.schemas.order import OrderStatusUpdate
from features.orders.services.order import _validate_transition, change_order_status
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


def make_mock_order(status: OrderStatus) -> MagicMock:
    order = MagicMock()
    order.id = uuid.uuid4()
    order.user_id = uuid.uuid4()
    order.restaurant_id = uuid.uuid4()
    order.status = status.value
    order.total_price = 500
    order.ready_at = None
    order.items = []
    return order


class TestValidateTransition:
    def test_pending_to_accepted(self):
        _validate_transition(OrderStatus.PENDING, OrderStatus.ACCEPTED)

    def test_pending_to_cancelled(self):
        _validate_transition(OrderStatus.PENDING, OrderStatus.CANCELLED)

    def test_accepted_to_cooking(self):
        _validate_transition(OrderStatus.ACCEPTED, OrderStatus.COOKING)

    def test_accepted_to_cancelled(self):
        _validate_transition(OrderStatus.ACCEPTED, OrderStatus.CANCELLED)

    def test_cooking_to_ready(self):
        _validate_transition(OrderStatus.COOKING, OrderStatus.READY)

    def test_ready_to_completed(self):
        _validate_transition(OrderStatus.READY, OrderStatus.COMPLETED)

    def test_invalid_pending_to_ready(self):
        with pytest.raises(InvalidStatusTransitionException):
            _validate_transition(OrderStatus.PENDING, OrderStatus.READY)

    def test_invalid_pending_to_completed(self):
        with pytest.raises(InvalidStatusTransitionException):
            _validate_transition(OrderStatus.PENDING, OrderStatus.COMPLETED)

    def test_invalid_pending_to_cooking(self):
        with pytest.raises(InvalidStatusTransitionException):
            _validate_transition(OrderStatus.PENDING, OrderStatus.COOKING)

    def test_invalid_cooking_to_accepted(self):
        with pytest.raises(InvalidStatusTransitionException):
            _validate_transition(OrderStatus.COOKING, OrderStatus.ACCEPTED)

    def test_invalid_completed_to_any(self):
        for status in OrderStatus:
            with pytest.raises(InvalidStatusTransitionException):
                _validate_transition(OrderStatus.COMPLETED, status)

    def test_invalid_cancelled_to_any(self):
        for status in OrderStatus:
            with pytest.raises(InvalidStatusTransitionException):
                _validate_transition(OrderStatus.CANCELLED, status)


class TestChangeOrderStatus:
    async def test_creates_event_on_success(self, mock_db_session):
        actor = make_user(user_role=UserRole.VENDOR)
        order = make_mock_order(OrderStatus.PENDING)
        status_data = OrderStatusUpdate(status=OrderStatus.ACCEPTED)
        updated_order = make_mock_order(OrderStatus.ACCEPTED)

        with (
            patch(
                "features.orders.crud.order.update_order_status",
                new_callable=AsyncMock,
                return_value=updated_order,
            ),
            patch(
                "features.orders.crud.order.create_order_event",
                new_callable=AsyncMock,
            ) as mock_event,
        ):
            await change_order_status(mock_db_session, order, status_data, actor=actor)

        mock_event.assert_awaited_once_with(
            mock_db_session,
            order_id=order.id,
            actor_id=actor.id,
            actor_role=UserRole.VENDOR.value,
            old_status=OrderStatus.PENDING,
            new_status=OrderStatus.ACCEPTED,
        )

    async def test_raises_on_invalid_transition(self, mock_db_session):
        actor = make_user(user_role=UserRole.STAFF)
        order = make_mock_order(OrderStatus.PENDING)
        status_data = OrderStatusUpdate(status=OrderStatus.COMPLETED)

        with pytest.raises(InvalidStatusTransitionException):
            await change_order_status(mock_db_session, order, status_data, actor=actor)

    async def test_does_not_create_event_on_invalid_transition(self, mock_db_session):
        actor = make_user(user_role=UserRole.STAFF)
        order = make_mock_order(OrderStatus.COOKING)
        status_data = OrderStatusUpdate(status=OrderStatus.PENDING)

        with patch(
            "features.orders.crud.order.create_order_event",
            new_callable=AsyncMock,
        ) as mock_event:
            with pytest.raises(InvalidStatusTransitionException):
                await change_order_status(mock_db_session, order, status_data, actor=actor)

        mock_event.assert_not_awaited()
