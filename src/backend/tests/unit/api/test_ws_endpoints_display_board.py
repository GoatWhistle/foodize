import uuid
from unittest.mock import AsyncMock, patch

from factories import make_user
from ws_test_helpers import FakeWebSocket, fake_session_ctx, make_redis_cache

from features.orders.api.ws import display_board_ws
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole
from shared.exceptions import AccessDeniedException


class TestDisplayBoardWS:
    async def test_no_token_sends_not_authenticated(self) -> None:
        websocket = FakeWebSocket()
        with patch(
            "shared.ws.extract_ws_token",
            new_callable=AsyncMock,
            return_value=None,
        ):
            await display_board_ws(uuid.uuid4(), websocket, token=None)

        assert websocket.first_message().get("error") == "not_authenticated"
        assert websocket.closed

    async def test_no_display_board_permission_sends_forbidden(self) -> None:
        websocket = FakeWebSocket()
        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=make_user(),
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=fake_session_ctx(),
            ),
        ):
            await display_board_ws(uuid.uuid4(), websocket, token="t")

        assert websocket.first_message().get("error") == "forbidden"
        assert websocket.closed

    async def test_restaurant_access_denied_sends_forbidden(self) -> None:
        websocket = FakeWebSocket()
        user = make_user(user_role=UserRole.STAFF.value)
        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.verify_restaurant_access",
                new_callable=AsyncMock,
                side_effect=AccessDeniedException(),
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=fake_session_ctx(),
            ),
        ):
            await display_board_ws(uuid.uuid4(), websocket, token="t")

        assert websocket.first_message().get("error") == "forbidden"
        assert websocket.closed

    async def test_staff_gets_display_board_with_cooking_and_ready(self) -> None:
        websocket = FakeWebSocket()
        user = make_user(user_role=UserRole.STAFF.value)
        rows = [(1001, OrderStatus.PENDING.value), (1002, OrderStatus.READY.value)]

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.verify_restaurant_access",
                new_callable=AsyncMock,
            ),
            patch(
                "features.orders.api.ws.get_active_orders_for_display",
                new_callable=AsyncMock,
                return_value=rows,
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
            await display_board_ws(uuid.uuid4(), websocket, token="t")

        board = websocket.first_message()
        assert 1001 in board["cooking"]
        assert 1002 in board["ready"]

    async def test_display_board_empty_orders(self) -> None:
        websocket = FakeWebSocket()
        user = make_user(user_role=UserRole.STAFF.value)

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.verify_restaurant_access",
                new_callable=AsyncMock,
            ),
            patch(
                "features.orders.api.ws.get_active_orders_for_display",
                new_callable=AsyncMock,
                return_value=[],
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
            await display_board_ws(uuid.uuid4(), websocket, token="t")

        assert websocket.first_message() == {"cooking": [], "ready": []}
