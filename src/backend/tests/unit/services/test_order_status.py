import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.services.order_status import (
    cancel_order,
    change_order_status,
    complete_order,
    force_cancel_order,
)
from features.orders.exceptions import (
    OrderAccessDeniedException,
    OrderNotCancellableException,
    OrderNotCompletableException,
    OrderNotFoundException,
    OrderReadyTimeRequiredException,
)
from features.orders.schemas.order import OrderCancelRequest, OrderStatusUpdate
from shared.enums.order_status import OrderStatus


def _order(status=OrderStatus.PENDING, user_id=None):
    o = MagicMock()
    o.id = uuid.uuid4()
    o.user_id = user_id or uuid.uuid4()
    o.restaurant_id = uuid.uuid4()
    o.display_id = 1001
    o.total_price = 500
    o.status = status.value
    o.restaurant = MagicMock()
    o.restaurant.name = "Test Restaurant"
    return o


def _actor(permissions=None):
    actor = MagicMock()
    actor.id = uuid.uuid4()
    actor.permissions = permissions or []
    return actor


@pytest.mark.asyncio
async def test_complete_order_raises_not_found():
    with patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=None):
        with pytest.raises(OrderNotFoundException):
            await complete_order(AsyncMock(), uuid.uuid4(), uuid.uuid4())


@pytest.mark.asyncio
async def test_complete_order_raises_access_denied():
    order = _order(status=OrderStatus.READY)
    with patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=order):
        with pytest.raises(OrderAccessDeniedException):
            await complete_order(AsyncMock(), order.id, uuid.uuid4())


@pytest.mark.asyncio
async def test_complete_order_raises_not_completable():
    user_id = uuid.uuid4()
    order = _order(status=OrderStatus.PENDING, user_id=user_id)
    with patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=order):
        with pytest.raises(OrderNotCompletableException):
            await complete_order(AsyncMock(), order.id, user_id)


@pytest.mark.asyncio
async def test_complete_order_success():
    user_id = uuid.uuid4()
    order = _order(status=OrderStatus.READY, user_id=user_id)
    mock_response = MagicMock()

    with (
        patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.update_order_status", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils._safe_publish", new_callable=AsyncMock),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response),
    ):
        result = await complete_order(AsyncMock(), order.id, user_id)

    assert result == mock_response


@pytest.mark.asyncio
async def test_cancel_order_raises_not_found():
    with patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=None):
        with pytest.raises(OrderNotFoundException):
            await cancel_order(AsyncMock(), uuid.uuid4(), uuid.uuid4(), OrderCancelRequest(reason="test"))


@pytest.mark.asyncio
async def test_cancel_order_raises_access_denied():
    order = _order(status=OrderStatus.PENDING)
    with patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=order):
        with pytest.raises(OrderAccessDeniedException):
            await cancel_order(AsyncMock(), order.id, uuid.uuid4(), OrderCancelRequest(reason="test"))


@pytest.mark.asyncio
async def test_cancel_order_raises_not_cancellable():
    user_id = uuid.uuid4()
    order = _order(status=OrderStatus.COMPLETED, user_id=user_id)
    with patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=order):
        with pytest.raises(OrderNotCancellableException):
            await cancel_order(AsyncMock(), order.id, user_id, OrderCancelRequest(reason="test"))


@pytest.mark.asyncio
async def test_cancel_order_success():
    user_id = uuid.uuid4()
    order = _order(status=OrderStatus.PENDING, user_id=user_id)
    mock_response = MagicMock()

    with (
        patch("features.orders.crud.order.get_order_by_identifier_for_update", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.update_order_status", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils._safe_publish", new_callable=AsyncMock),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response),
    ):
        result = await cancel_order(AsyncMock(), order.id, user_id, OrderCancelRequest(reason="changed mind"))

    assert result == mock_response


@pytest.mark.asyncio
async def test_force_cancel_order_raises_not_found():
    with patch("features.orders.crud.order.get_order_by_id_for_update", new_callable=AsyncMock, return_value=None):
        with pytest.raises(OrderNotFoundException):
            await force_cancel_order(AsyncMock(), uuid.uuid4(), _actor(), "reason")


@pytest.mark.asyncio
async def test_force_cancel_order_raises_not_cancellable_when_terminal():
    order = _order(status=OrderStatus.COMPLETED)
    with patch(
        "features.orders.crud.order.get_order_by_id_for_update",
        new_callable=AsyncMock,
        return_value=order,
    ):
        with pytest.raises(OrderNotCancellableException):
            await force_cancel_order(AsyncMock(), order.id, _actor(), "reason")


@pytest.mark.asyncio
async def test_force_cancel_order_success():
    order = _order(status=OrderStatus.ACCEPTED)
    actor = _actor()
    mock_response = MagicMock()

    with (
        patch("features.orders.crud.order.get_order_by_id_for_update", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.update_order_status", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.admin.audit_log.service.log_action", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils._safe_publish", new_callable=AsyncMock),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response),
    ):
        result = await force_cancel_order(AsyncMock(), order.id, actor, "admin override")

    assert result == mock_response


@pytest.mark.asyncio
async def test_change_order_status_requires_ready_time_for_accepted():
    order = _order(status=OrderStatus.PENDING)
    actor = _actor()
    status_data = OrderStatusUpdate(status=OrderStatus.ACCEPTED)

    with patch("features.orders.services.order_utils._validate_transition"):
        with pytest.raises(OrderReadyTimeRequiredException):
            await change_order_status(AsyncMock(), order, status_data, actor)


@pytest.mark.asyncio
async def test_change_order_status_accepted_with_ready_at():
    order = _order(status=OrderStatus.PENDING)
    actor = _actor()
    ready_at = datetime.now(timezone.utc) + timedelta(minutes=20)
    status_data = OrderStatusUpdate(status=OrderStatus.ACCEPTED, estimated_ready_at=ready_at)
    mock_response = MagicMock()

    with (
        patch("features.orders.services.order_utils._validate_transition"),
        patch("features.orders.crud.order.update_order_status", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils._safe_publish", new_callable=AsyncMock),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response),
    ):
        result = await change_order_status(AsyncMock(), order, status_data, actor)

    assert order.estimated_ready_at == ready_at
    assert result == mock_response


@pytest.mark.asyncio
async def test_change_order_status_accepted_with_minutes():
    order = _order(status=OrderStatus.PENDING)
    actor = _actor()
    status_data = OrderStatusUpdate(status=OrderStatus.ACCEPTED, estimated_ready_in_minutes=25)
    mock_response = MagicMock()

    with (
        patch("features.orders.services.order_utils._validate_transition"),
        patch("features.orders.crud.order.update_order_status", new_callable=AsyncMock, return_value=order),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils._safe_publish", new_callable=AsyncMock),
        patch("features.orders.schemas.order.OrderResponse.model_validate", return_value=mock_response),
    ):
        result = await change_order_status(AsyncMock(), order, status_data, actor)

    assert order.estimated_ready_at is not None
    assert result == mock_response
