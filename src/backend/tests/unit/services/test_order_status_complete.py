import uuid
from collections.abc import Iterator
from unittest.mock import AsyncMock, patch

import pytest

from features.orders.exceptions import (
    OrderAccessDeniedException,
    OrderNotCompletableException,
    OrderNotFoundException,
)
from features.orders.schemas.order import OrderResponse
from features.orders.services.order_status import complete_order
from shared.enums.order_status import OrderStatus

from .order_helpers import make_order, make_session


@pytest.fixture(autouse=True)
def _loyalty_noop() -> Iterator[None]:
    with (
        patch(
            "features.orders.services.order_status.loyalty_service.accrue_for_order",
            new_callable=AsyncMock,
        ),
        patch(
            "features.orders.services.order_status.loyalty_service.release_for_order",
            new_callable=AsyncMock,
        ),
    ):
        yield


async def test_complete_order_raises_not_found() -> None:
    with (
        patch(
            "features.orders.crud.order.get_order_by_identifier_for_update",
            new_callable=AsyncMock,
            return_value=None,
        ),
        pytest.raises(OrderNotFoundException),
    ):
        await complete_order(make_session(), uuid.uuid4(), uuid.uuid4())


async def test_complete_order_raises_access_denied() -> None:
    order = make_order(status=OrderStatus.READY)
    with (
        patch(
            "features.orders.crud.order.get_order_by_identifier_for_update",
            new_callable=AsyncMock,
            return_value=order,
        ),
        pytest.raises(OrderAccessDeniedException),
    ):
        await complete_order(make_session(), order.id, uuid.uuid4())


async def test_complete_order_raises_not_completable() -> None:
    user_id = uuid.uuid4()
    order = make_order(status=OrderStatus.PENDING, user_id=user_id)
    with (
        patch(
            "features.orders.crud.order.get_order_by_identifier_for_update",
            new_callable=AsyncMock,
            return_value=order,
        ),
        pytest.raises(OrderNotCompletableException),
    ):
        await complete_order(make_session(), order.id, user_id)


async def test_complete_order_success() -> None:
    user_id = uuid.uuid4()
    order = make_order(status=OrderStatus.READY, user_id=user_id)

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
        result = await complete_order(make_session(), order.id, user_id)

    assert isinstance(result, OrderResponse)
    assert result.id == order.id
