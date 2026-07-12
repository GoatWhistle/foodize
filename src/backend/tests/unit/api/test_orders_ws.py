import json
import uuid
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from factories import make_user

from features.orders.api.ws import (
    _build_display_board,
    _can_read_order,
    _order_status_pubsub_loop,
    _restaurant_orders_pubsub_loop,
)
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission
from shared.enums.roles import UserRole
from shared.exceptions import AccessDeniedException


def _order(user_id: uuid.UUID | None = None, restaurant_id: uuid.UUID | None = None) -> MagicMock:
    order = MagicMock()
    order.user_id = user_id or uuid.uuid4()
    order.restaurant_id = restaurant_id or uuid.uuid4()
    return order


class TestCanReadOrder:
    @pytest.mark.asyncio
    async def test_customer_can_read_own_order(self) -> None:
        user = make_user()
        order = _order(user_id=user.id)

        assert await _can_read_order(AsyncMock(), order, user) is True

    @pytest.mark.asyncio
    async def test_customer_cannot_read_another_user_order(self) -> None:
        user = make_user()
        order = _order(user_id=uuid.uuid4())

        assert await _can_read_order(AsyncMock(), order, user) is False

    @pytest.mark.asyncio
    async def test_admin_can_read_any_order_without_restaurant_check(self) -> None:
        user = make_user(user_role=UserRole.ADMIN.value)
        order = _order(user_id=uuid.uuid4())

        with patch(
            "features.orders.api.order.verify_restaurant_access",
            new_callable=AsyncMock,
        ) as verify_access:
            assert await _can_read_order(AsyncMock(), order, user) is True

        verify_access.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_restaurant_reader_must_have_restaurant_access(self) -> None:
        user = make_user(user_role=UserRole.STAFF.value)
        order = _order(user_id=uuid.uuid4())

        with patch(
            "features.orders.api.order.verify_restaurant_access",
            new_callable=AsyncMock,
        ) as verify_access:
            assert await _can_read_order(AsyncMock(), order, user) is True

        verify_access.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_restaurant_reader_denied_when_access_check_fails(self) -> None:
        user = make_user(user_role=UserRole.STAFF.value)
        order = _order(user_id=uuid.uuid4())

        with patch(
            "features.orders.api.order.verify_restaurant_access",
            new_callable=AsyncMock,
            side_effect=AccessDeniedException(),
        ):
            assert await _can_read_order(AsyncMock(), order, user) is False

    @pytest.mark.asyncio
    async def test_user_without_order_permissions_is_denied(self) -> None:
        user = make_user()
        user.permissions = [Permission.MENU_READ.value]
        order = _order(user_id=user.id)

        assert await _can_read_order(AsyncMock(), order, user) is False


def test_build_display_board_splits_cooking_and_ready_orders() -> None:
    rows = [
        (1001, OrderStatus.PENDING.value),
        (1002, OrderStatus.ACCEPTED.value),
        (1003, OrderStatus.READY.value),
        (1004, OrderStatus.COMPLETED.value),
        (1005, OrderStatus.CANCELLED.value),
    ]

    assert _build_display_board(rows) == {
        "cooking": [1001, 1002],
        "ready": [1003],
    }


def _pubsub_from(messages: list[dict[str, Any]]) -> MagicMock:
    pubsub = MagicMock()

    async def _listen() -> AsyncGenerator[dict[str, Any]]:
        for message in messages:
            yield message

    pubsub.listen = _listen
    return pubsub


def _sent_texts(websocket: AsyncMock) -> list[str]:
    return [call.args[0] for call in websocket.send_text.await_args_list]


class TestOrderStatusPubsubLoop:
    @pytest.mark.asyncio
    async def test_sends_order_payload_on_status_change(self) -> None:
        order_id = uuid.uuid4()
        websocket = AsyncMock()
        pubsub = _pubsub_from(
            [{"type": "message", "data": OrderStatus.READY.value.encode("utf-8")}]
        )

        order = MagicMock()
        order.status = OrderStatus.READY.value
        response = MagicMock()
        response.model_dump.return_value = {
            "id": str(order_id),
            "status": OrderStatus.READY.value,
            "display_id": 1001,
        }

        session = MagicMock()

        @asynccontextmanager
        async def _session_factory() -> AsyncGenerator[MagicMock]:
            yield session

        with (
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                _session_factory,
            ),
            patch(
                "features.orders.api.ws.get_order_by_id",
                new=AsyncMock(return_value=order),
            ),
            patch(
                "features.orders.api.ws.OrderResponse.model_validate",
                return_value=response,
            ),
        ):
            await _order_status_pubsub_loop(websocket, pubsub, order_id, OrderStatus.PENDING.value)

        texts = _sent_texts(websocket)
        assert len(texts) == 1
        payload = json.loads(texts[0])
        assert payload["id"] == str(order_id)
        assert payload["status"] == OrderStatus.READY.value
        assert payload["display_id"] == 1001

    @pytest.mark.asyncio
    async def test_skips_query_when_status_unchanged(self) -> None:
        order_id = uuid.uuid4()
        websocket = AsyncMock()
        pubsub = _pubsub_from([{"type": "message", "data": OrderStatus.PENDING.value}])

        get_order = AsyncMock()
        with patch("features.orders.api.ws.get_order_by_id", new=get_order):
            await _order_status_pubsub_loop(websocket, pubsub, order_id, OrderStatus.PENDING.value)

        get_order.assert_not_awaited()
        assert _sent_texts(websocket) == []

    @pytest.mark.asyncio
    async def test_stops_on_terminal_status(self) -> None:
        order_id = uuid.uuid4()
        websocket = AsyncMock()
        pubsub = _pubsub_from(
            [
                {"type": "message", "data": OrderStatus.COMPLETED.value},
                {"type": "message", "data": OrderStatus.READY.value},
            ]
        )

        order = MagicMock()
        order.status = OrderStatus.COMPLETED.value
        response = MagicMock()
        response.model_dump.return_value = {
            "id": str(order_id),
            "status": OrderStatus.COMPLETED.value,
            "display_id": 1001,
        }

        session = MagicMock()

        @asynccontextmanager
        async def _session_factory() -> AsyncGenerator[MagicMock]:
            yield session

        get_order = AsyncMock(return_value=order)
        with (
            patch(
                "features.orders.api.ws.db_helper.session_factory",
                _session_factory,
            ),
            patch("features.orders.api.ws.get_order_by_id", new=get_order),
            patch(
                "features.orders.api.ws.OrderResponse.model_validate",
                return_value=response,
            ),
        ):
            await _order_status_pubsub_loop(websocket, pubsub, order_id, OrderStatus.PENDING.value)

        assert get_order.await_count == 1
        assert len(_sent_texts(websocket)) == 1


class TestRestaurantOrdersPubsubLoop:
    @pytest.mark.asyncio
    async def test_wraps_payload_in_event_field(self) -> None:
        websocket = AsyncMock()
        pubsub = _pubsub_from(
            [
                {"type": "subscribe", "data": 1},
                {"type": "message", "data": b"new_order"},
                {"type": "message", "data": "status_changed:ready"},
            ]
        )

        await _restaurant_orders_pubsub_loop(websocket, pubsub)

        texts = _sent_texts(websocket)
        assert [json.loads(t) for t in texts] == [
            {"event": "new_order"},
            {"event": "status_changed:ready"},
        ]
