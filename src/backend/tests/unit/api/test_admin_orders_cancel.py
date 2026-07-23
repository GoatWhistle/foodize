import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.admin.api import router as admin_router
from features.admin.api.orders import force_cancel_order as force_cancel_order_route
from features.admin.api.schemas import ForceCancelOrderRequest
from features.orders.exceptions import OrderNotCancellableException


async def test_admin_force_cancel_order_calls_service() -> None:
    order_id = uuid.uuid4()
    actor = MagicMock()
    session = AsyncMock()
    mock_response = MagicMock()

    with patch(
        "features.orders.services.order_status.force_cancel_order",
        new_callable=AsyncMock,
        return_value=mock_response,
    ) as mock_service:
        result = await force_cancel_order_route(
            order_id,
            ForceCancelOrderRequest(reason="fraud"),
            actor,
            session,
        )

    mock_service.assert_awaited_once_with(session, order_id, actor, "fraud")
    assert result.data == mock_response


async def test_admin_force_cancel_order_propagates_service_error() -> None:
    with (
        patch(
            "features.orders.services.order_status.force_cancel_order",
            new_callable=AsyncMock,
            side_effect=OrderNotCancellableException(),
        ),
        pytest.raises(OrderNotCancellableException),
    ):
        await force_cancel_order_route(
            uuid.uuid4(),
            ForceCancelOrderRequest(reason="fraud"),
            MagicMock(),
            AsyncMock(),
        )


def test_admin_force_cancel_route_mounted() -> None:
    paths = {getattr(route, "path", None) for route in admin_router.routes}
    assert "/admin/orders/{order_id}/cancel" in paths
