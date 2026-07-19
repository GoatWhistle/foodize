import uuid
from contextlib import ExitStack
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from factories import make_user
from ws_test_helpers import FakeWebSocket, fake_session_ctx, make_redis_cache

from features.orders.api.ws import order_status_ws
from features.users.models import User
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
    order.total_price = 500
    order.comment = None
    order.cancellation_reason = None
    order.requested_pickup_at = None
    order.created_at = datetime.now(UTC)
    order.estimated_ready_at = None
    order.ready_at = None
    order.items = []
    order.user = None
    order.restaurant = None
    return order


def _enter_auth(stack: ExitStack, user: User) -> None:
    stack.enter_context(
        patch("shared.ws.resolve_ws_token_user_id", new_callable=AsyncMock, return_value=user.id)
    )
    stack.enter_context(
        patch("shared.ws.get_user_by_id", new_callable=AsyncMock, return_value=user)
    )
    stack.enter_context(
        patch("shared.ws.db_helper.session_factory", side_effect=lambda: fake_session_ctx())
    )


def _enter_order(stack: ExitStack, order: object | None) -> None:
    stack.enter_context(
        patch("features.orders.api.ws.get_order_by_id", new_callable=AsyncMock, return_value=order)
    )
    stack.enter_context(
        patch(
            "features.orders.api.ws.db_helper.session_factory",
            side_effect=lambda: fake_session_ctx(),
        )
    )


class TestOrderStatusWS:
    async def test_no_token_sends_not_authenticated(self) -> None:
        websocket = FakeWebSocket()
        await order_status_ws(uuid.uuid4(), websocket, token=None)

        assert websocket.first_message().get("error") == "not_authenticated"
        assert websocket.closed

    async def test_order_not_found_sends_not_found(self) -> None:
        websocket = FakeWebSocket()
        user = make_user()
        with ExitStack() as stack:
            _enter_auth(stack, user)
            _enter_order(stack, None)
            await order_status_ws(uuid.uuid4(), websocket, token="t")

        assert websocket.first_message().get("error") == "not_found"
        assert websocket.closed

    async def test_forbidden_order_sends_forbidden(self) -> None:
        websocket = FakeWebSocket()
        user = make_user()
        order = _make_order(user_id=uuid.uuid4())
        with ExitStack() as stack:
            _enter_auth(stack, user)
            _enter_order(stack, order)
            await order_status_ws(order.id, websocket, token="t")

        assert websocket.first_message().get("error") == "forbidden"
        assert websocket.closed

    async def test_completed_order_sends_data_and_closes(self) -> None:
        websocket = FakeWebSocket()
        user = make_user()
        order = _make_order(user_id=user.id, status=OrderStatus.COMPLETED.value)

        with ExitStack() as stack:
            _enter_auth(stack, user)
            _enter_order(stack, order)
            await order_status_ws(order.id, websocket, token="t")

        assert websocket.first_message().get("status") == OrderStatus.COMPLETED.value

    async def test_pending_order_sends_data(self) -> None:
        websocket = FakeWebSocket()
        user = make_user()
        order = _make_order(user_id=user.id, status=OrderStatus.PENDING.value)

        with ExitStack() as stack:
            _enter_auth(stack, user)
            _enter_order(stack, order)
            stack.enter_context(patch("shared.ws.get_redis_cache", return_value=make_redis_cache()))
            await order_status_ws(order.id, websocket, token="t")

        assert websocket.first_message().get("id") == str(order.id)
