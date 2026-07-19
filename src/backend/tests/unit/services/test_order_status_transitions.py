from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import pytest

from features.orders.exceptions import (
    InvalidStatusTransitionException,
    OrderReadyTimeRequiredException,
)
from features.orders.schemas.order import OrderResponse, OrderStatusUpdate
from features.orders.services.order_status import change_order_status
from shared.enums.order_status import OrderStatus

from .order_helpers import make_actor, make_order, make_session


async def test_change_order_status_rejects_invalid_transition() -> None:
    order = make_order(status=OrderStatus.PENDING)
    actor = make_actor()
    status_data = OrderStatusUpdate(status=OrderStatus.READY)

    with pytest.raises(InvalidStatusTransitionException):
        await change_order_status(make_session(), order, status_data, actor)


async def test_change_order_status_requires_ready_time_for_accepted() -> None:
    order = make_order(status=OrderStatus.PENDING)
    actor = make_actor()
    status_data = OrderStatusUpdate(status=OrderStatus.ACCEPTED)

    with pytest.raises(OrderReadyTimeRequiredException):
        await change_order_status(make_session(), order, status_data, actor)


async def test_change_order_status_accepted_with_ready_at() -> None:
    order = make_order(status=OrderStatus.PENDING)
    actor = make_actor()
    ready_at = datetime.now(UTC) + timedelta(minutes=20)
    status_data = OrderStatusUpdate(status=OrderStatus.ACCEPTED, estimated_ready_at=ready_at)

    with (
        patch(
            "features.orders.crud.order.update_order_status",
            new_callable=AsyncMock,
            return_value=order,
        ),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils.safe_publish", new_callable=AsyncMock),
    ):
        result = await change_order_status(make_session(), order, status_data, actor)

    assert order.estimated_ready_at == ready_at
    assert isinstance(result, OrderResponse)
    assert result.id == order.id


async def test_change_order_status_accepted_with_minutes() -> None:
    order = make_order(status=OrderStatus.PENDING)
    actor = make_actor()
    status_data = OrderStatusUpdate(status=OrderStatus.ACCEPTED, estimated_ready_in_minutes=25)

    with (
        patch(
            "features.orders.crud.order.update_order_status",
            new_callable=AsyncMock,
            return_value=order,
        ),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils.safe_publish", new_callable=AsyncMock),
    ):
        result = await change_order_status(make_session(), order, status_data, actor)

    assert order.estimated_ready_at is not None
    assert isinstance(result, OrderResponse)
    assert result.id == order.id
