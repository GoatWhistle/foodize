import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from factories import make_user
from ws_test_helpers import FakeWebSocket, fake_session_ctx, make_redis_cache

from features.orders.api.ws import order_status_ws
from shared.enums.order_status import OrderStatus


def _make_order(
    user_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
    status: str = OrderStatus.PENDING.value,
) -> MagicMock:
    order = MagicMock()
    order.id = uuid.uuid4()
    order.user_id = user_id or uuid.uuid4()
    order.restaurant_id = restaurant_id or uuid.uuid4()
    order.status = status
    order.display_id = 1001
    return order


class TestOrderStatusWS:
    @pytest.mark.asyncio
    async def test_no_token_sends_not_authenticated(self) -> None:
        websocket = FakeWebSocket()
        with patch(
            "shared.ws.extract_ws_token",
            new_callable=AsyncMock,
            return_value=None,
        ):
            await order_status_ws(uuid.uuid4(), websocket, token=None)

        assert websocket.first_message().get("error") == "not_authenticated"
        assert websocket.closed

    @pytest.mark.asyncio
    async def test_order_not_found_sends_not_found(self) -> None:
        websocket = FakeWebSocket()
        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=make_user(),
            ),
            patch(
                "features.orders.api.ws.get_order_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=fake_session_ctx(),
            ),
        ):
            await order_status_ws(uuid.uuid4(), websocket, token="t")

        assert websocket.first_message().get("error") == "not_found"
        assert websocket.closed

    @pytest.mark.asyncio
    async def test_forbidden_order_sends_forbidden(self) -> None:
        websocket = FakeWebSocket()
        order = _make_order(user_id=uuid.uuid4())
        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=make_user(),
            ),
            patch(
                "features.orders.api.ws.get_order_by_id",
                new_callable=AsyncMock,
                return_value=order,
            ),
            patch(
                "features.orders.api.ws._can_read_order",
                new_callable=AsyncMock,
                return_value=False,
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=fake_session_ctx(),
            ),
        ):
            await order_status_ws(order.id, websocket, token="t")

        assert websocket.first_message().get("error") == "forbidden"
        assert websocket.closed

    @pytest.mark.asyncio
    async def test_completed_order_sends_data_and_closes(self) -> None:
        websocket = FakeWebSocket()
        user = make_user()
        order = _make_order(user_id=user.id, status=OrderStatus.COMPLETED.value)
        mock_response = MagicMock()
        mock_response.model_dump = MagicMock(
            return_value={"id": str(order.id), "status": order.status}
        )

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.get_order_by_id",
                new_callable=AsyncMock,
                return_value=order,
            ),
            patch(
                "features.orders.api.ws._can_read_order",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch(
                "features.orders.api.ws.OrderResponse.model_validate",
                return_value=mock_response,
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=fake_session_ctx(),
            ),
        ):
            await order_status_ws(order.id, websocket, token="t")

        assert websocket.first_message().get("status") == OrderStatus.COMPLETED.value

    @pytest.mark.asyncio
    async def test_pending_order_sends_data(self) -> None:
        websocket = FakeWebSocket()
        user = make_user()
        order = _make_order(user_id=user.id, status=OrderStatus.PENDING.value)
        mock_response = MagicMock()
        mock_response.model_dump = MagicMock(
            return_value={"id": str(order.id), "status": order.status}
        )

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.get_order_by_id",
                new_callable=AsyncMock,
                return_value=order,
            ),
            patch(
                "features.orders.api.ws._can_read_order",
                new_callable=AsyncMock,
                return_value=True,
            ),
            patch(
                "features.orders.api.ws.OrderResponse.model_validate",
                return_value=mock_response,
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=fake_session_ctx(),
            ),
            patch(
                "shared.ws.get_redis_cache",
                return_value=make_redis_cache(),
            ),
        ):
            await order_status_ws(order.id, websocket, token="t")

        assert websocket.first_message().get("id") == str(order.id)
