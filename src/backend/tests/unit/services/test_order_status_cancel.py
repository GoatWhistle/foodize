import uuid
from unittest.mock import AsyncMock, patch

import pytest

from features.orders.exceptions import (
    OrderAccessDeniedException,
    OrderNotCancellableException,
    OrderNotFoundException,
)
from features.orders.schemas.order import OrderCancelRequest, OrderResponse
from features.orders.services.order_status import cancel_order, force_cancel_order
from shared.enums.order_status import OrderStatus

from .order_helpers import make_actor, make_order, make_session


async def test_cancel_order_raises_not_found() -> None:
    with patch(
        "features.orders.crud.order.get_order_by_identifier_for_update",
        new_callable=AsyncMock,
        return_value=None,
    ):
        with pytest.raises(OrderNotFoundException):
            await cancel_order(
                make_session(), uuid.uuid4(), uuid.uuid4(), OrderCancelRequest(reason="test")
            )


async def test_cancel_order_raises_access_denied() -> None:
    order = make_order(status=OrderStatus.PENDING)
    with patch(
        "features.orders.crud.order.get_order_by_identifier_for_update",
        new_callable=AsyncMock,
        return_value=order,
    ):
        with pytest.raises(OrderAccessDeniedException):
            await cancel_order(
                make_session(), order.id, uuid.uuid4(), OrderCancelRequest(reason="test")
            )


async def test_cancel_order_raises_not_cancellable() -> None:
    user_id = uuid.uuid4()
    order = make_order(status=OrderStatus.COMPLETED, user_id=user_id)
    with patch(
        "features.orders.crud.order.get_order_by_identifier_for_update",
        new_callable=AsyncMock,
        return_value=order,
    ):
        with pytest.raises(OrderNotCancellableException):
            await cancel_order(make_session(), order.id, user_id, OrderCancelRequest(reason="test"))


async def test_cancel_order_success() -> None:
    user_id = uuid.uuid4()
    order = make_order(status=OrderStatus.PENDING, user_id=user_id)

    with (
        patch(
            "features.orders.crud.order.get_order_by_identifier_for_update",
            new_callable=AsyncMock,
            return_value=order,
        ),
        patch(
            "features.orders.crud.order.update_order_status",
            new_callable=AsyncMock,
            return_value=order,
        ),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils.safe_publish", new_callable=AsyncMock),
    ):
        result = await cancel_order(
            make_session(), order.id, user_id, OrderCancelRequest(reason="changed mind")
        )

    assert isinstance(result, OrderResponse)
    assert result.id == order.id
    assert order.cancellation_reason == "changed mind"


async def test_force_cancel_order_raises_not_found() -> None:
    with patch(
        "features.orders.crud.order.get_order_by_id_for_update",
        new_callable=AsyncMock,
        return_value=None,
    ):
        with pytest.raises(OrderNotFoundException):
            await force_cancel_order(make_session(), uuid.uuid4(), make_actor(), "reason")


async def test_force_cancel_order_raises_not_cancellable_when_terminal() -> None:
    order = make_order(status=OrderStatus.COMPLETED)
    with patch(
        "features.orders.crud.order.get_order_by_id_for_update",
        new_callable=AsyncMock,
        return_value=order,
    ):
        with pytest.raises(OrderNotCancellableException):
            await force_cancel_order(make_session(), order.id, make_actor(), "reason")


async def test_force_cancel_order_success() -> None:
    order = make_order(status=OrderStatus.ACCEPTED)
    actor = make_actor()

    with (
        patch(
            "features.orders.crud.order.get_order_by_id_for_update",
            new_callable=AsyncMock,
            return_value=order,
        ),
        patch(
            "features.orders.crud.order.update_order_status",
            new_callable=AsyncMock,
            return_value=order,
        ),
        patch("features.orders.crud.order.create_order_event", new_callable=AsyncMock),
        patch("features.admin.audit_log.service.log_action", new_callable=AsyncMock),
        patch("features.notifications.outbox_service.enqueue_event", new_callable=AsyncMock),
        patch("features.orders.services.order_utils.safe_publish", new_callable=AsyncMock),
    ):
        result = await force_cancel_order(make_session(), order.id, actor, "admin override")

    assert isinstance(result, OrderResponse)
    assert result.id == order.id
    assert order.cancellation_reason == "admin override"
