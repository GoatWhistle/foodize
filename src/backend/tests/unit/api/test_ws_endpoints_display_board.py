import uuid
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

from factories import make_user
from fastapi import FastAPI
from starlette.testclient import TestClient

from features.orders.api.ws import router as ws_router
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


def _make_test_app():
    test_app = FastAPI()
    test_app.include_router(ws_router, prefix="/api/v1")
    return test_app


def _make_pubsub():
    pubsub = AsyncMock()
    pubsub.subscribe = AsyncMock()
    pubsub.unsubscribe = AsyncMock()
    pubsub.get_message = AsyncMock(return_value=None)
    return pubsub


def _make_redis_cache(pubsub=None):
    redis_client = MagicMock()
    redis_client.pubsub = MagicMock(return_value=pubsub or _make_pubsub())
    cache = AsyncMock()
    cache.exists = AsyncMock(return_value=False)
    cache.get_raw_client = MagicMock(return_value=redis_client)
    return cache


@asynccontextmanager
async def _fake_session_ctx():
    yield AsyncMock()


class TestDisplayBoardWS:
    def test_no_token_sends_not_authenticated(self):
        test_app = _make_test_app()
        restaurant_id = uuid.uuid4()

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch(
                "features.orders.api.ws.get_redis_cache",
                return_value=_make_redis_cache(),
            ),
        ):
            with TestClient(test_app) as client:
                with client.websocket_connect(
                    f"/api/v1/ws/restaurants/{restaurant_id}/display-board"
                ) as ws:
                    data = ws.receive_json()
                    assert data.get("error") == "not_authenticated"

    def test_no_display_board_permission_sends_forbidden(self):
        test_app = _make_test_app()
        user = make_user()

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=_fake_session_ctx(),
            ),
            patch(
                "features.orders.api.ws.get_redis_cache",
                return_value=_make_redis_cache(),
            ),
        ):
            with TestClient(test_app) as client:
                with client.websocket_connect(
                    f"/api/v1/ws/restaurants/{uuid.uuid4()}/display-board"
                ) as ws:
                    data = ws.receive_json()
                    assert data.get("error") == "forbidden"

    def test_restaurant_access_denied_sends_forbidden(self):
        test_app = _make_test_app()
        user = make_user(user_role=UserRole.STAFF.value)
        restaurant_id = uuid.uuid4()

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.verify_restaurant_access",
                new_callable=AsyncMock,
                side_effect=Exception("access denied"),
            ),
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                return_value=_fake_session_ctx(),
            ),
            patch(
                "features.orders.api.ws.get_redis_cache",
                return_value=_make_redis_cache(),
            ),
        ):
            with TestClient(test_app) as client:
                with client.websocket_connect(
                    f"/api/v1/ws/restaurants/{restaurant_id}/display-board"
                ) as ws:
                    data = ws.receive_json()
                    assert data.get("error") == "forbidden"

    def test_staff_gets_display_board_with_cooking_and_ready(self):
        test_app = _make_test_app()
        user = make_user(user_role=UserRole.STAFF.value)
        restaurant_id = uuid.uuid4()
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
                return_value=_fake_session_ctx(),
            ),
            patch(
                "features.orders.api.ws.get_redis_cache",
                return_value=_make_redis_cache(),
            ),
        ):
            with TestClient(test_app) as client:
                with client.websocket_connect(
                    f"/api/v1/ws/restaurants/{restaurant_id}/display-board"
                ) as ws:
                    data = ws.receive_json()
                    assert "cooking" in data
                    assert "ready" in data
                    assert 1001 in data["cooking"]
                    assert 1002 in data["ready"]

    def test_display_board_empty_orders(self):
        test_app = _make_test_app()
        user = make_user(user_role=UserRole.STAFF.value)
        restaurant_id = uuid.uuid4()

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
                return_value=_fake_session_ctx(),
            ),
            patch(
                "features.orders.api.ws.get_redis_cache",
                return_value=_make_redis_cache(),
            ),
        ):
            with TestClient(test_app) as client:
                with client.websocket_connect(
                    f"/api/v1/ws/restaurants/{restaurant_id}/display-board"
                ) as ws:
                    data = ws.receive_json()
                    assert data == {"cooking": [], "ready": []}
