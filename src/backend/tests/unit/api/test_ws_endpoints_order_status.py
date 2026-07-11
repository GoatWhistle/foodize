import uuid
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch

from factories import make_user
from fastapi import FastAPI
from starlette.testclient import TestClient

from features.orders.api.ws import router as ws_router
from shared.enums.order_status import OrderStatus


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


def _make_order(
    user_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
    status: str = OrderStatus.PENDING.value,
):
    order = MagicMock()
    order.id = uuid.uuid4()
    order.user_id = user_id or uuid.uuid4()
    order.restaurant_id = restaurant_id or uuid.uuid4()
    order.status = status
    order.display_id = 1001
    return order


@asynccontextmanager
async def _fake_session_ctx():
    yield AsyncMock()


class TestOrderStatusWS:
    def test_no_token_sends_not_authenticated(self):
        test_app = _make_test_app()
        order_id = uuid.uuid4()

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
                with client.websocket_connect(f"/api/v1/ws/orders/{order_id}") as ws:
                    data = ws.receive_json()
                    assert data.get("error") == "not_authenticated"

    def test_order_not_found_sends_not_found(self):
        test_app = _make_test_app()
        user = make_user()
        order_id = uuid.uuid4()

        with (
            patch(
                "features.orders.api.ws._authenticate_ws_user",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch(
                "features.orders.api.ws.get_order_by_id",
                new_callable=AsyncMock,
                return_value=None,
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
                with client.websocket_connect(f"/api/v1/ws/orders/{order_id}") as ws:
                    data = ws.receive_json()
                    assert data.get("error") == "not_found"

    def test_forbidden_order_sends_forbidden(self):
        test_app = _make_test_app()
        user = make_user()
        order = _make_order(user_id=uuid.uuid4())

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
                return_value=False,
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
                with client.websocket_connect(f"/api/v1/ws/orders/{order.id}") as ws:
                    data = ws.receive_json()
                    assert data.get("error") == "forbidden"

    def test_completed_order_sends_data_and_closes(self):
        test_app = _make_test_app()
        user = make_user()
        order = _make_order(user_id=user.id, status=OrderStatus.COMPLETED.value)
        order_dict = {"id": str(order.id), "status": order.status}
        mock_response = MagicMock()
        mock_response.model_dump = MagicMock(return_value=order_dict)

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
                return_value=_fake_session_ctx(),
            ),
            patch(
                "features.orders.api.ws.get_redis_cache",
                return_value=_make_redis_cache(),
            ),
        ):
            with TestClient(test_app) as client:
                with client.websocket_connect(f"/api/v1/ws/orders/{order.id}") as ws:
                    data = ws.receive_json()
                    assert data.get("status") == OrderStatus.COMPLETED.value

    def test_pending_order_sends_data(self):
        test_app = _make_test_app()
        user = make_user()
        order = _make_order(user_id=user.id, status=OrderStatus.PENDING.value)
        order_dict = {"id": str(order.id), "status": order.status}
        mock_response = MagicMock()
        mock_response.model_dump = MagicMock(return_value=order_dict)

        pubsub = _make_pubsub()

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
                return_value=_fake_session_ctx(),
            ),
            patch(
                "features.orders.api.ws.get_redis_cache",
                return_value=_make_redis_cache(pubsub=pubsub),
            ),
        ):
            with TestClient(test_app, raise_server_exceptions=False) as client:
                with client.websocket_connect(f"/api/v1/ws/orders/{order.id}") as ws:
                    data = ws.receive_json()
                    assert data.get("id") == str(order.id)
