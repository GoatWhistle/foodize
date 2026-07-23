import uuid
from http import HTTPStatus
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from pydantic import JsonValue

from features.orders.dependencies import get_order_for_staff_or_vendor
from features.orders.exceptions import InvalidStatusTransitionException
from features.orders.models import Order
from main import app
from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission


def _make_mock_event(order_id: uuid.UUID) -> dict[str, JsonValue]:
    return {
        "id": str(uuid.uuid4()),
        "order_id": str(order_id),
        "actor_id": str(uuid.uuid4()),
        "actor_permissions": [Permission.ORDERS_MANAGE_STATUS.value],
        "old_status": OrderStatus.PENDING.value,
        "new_status": OrderStatus.ACCEPTED.value,
        "created_at": "2026-04-18T12:00:00",
    }


def _make_mock_order(order_id: uuid.UUID, user_id: uuid.UUID | None = None) -> Order:
    order = Order()
    order.id = order_id
    order.user_id = user_id or uuid.uuid4()
    order.restaurant_id = uuid.uuid4()
    return order


class TestOrderEventsAPI:
    @pytest.mark.usefixtures("as_vendor")
    async def test_read_order_events_as_vendor(self, client: AsyncClient) -> None:
        order_id = uuid.uuid4()
        mock_order = _make_mock_order(order_id)
        mock_events = [_make_mock_event(order_id) for _ in range(3)]

        with (
            patch(
                "features.orders.api.order.service.get_order_by_identifier",
                new_callable=AsyncMock,
                return_value=mock_order,
            ),
            patch(
                "features.orders.api.order.verify_order_read_access",
                new_callable=AsyncMock,
            ),
            patch(
                "features.orders.api.order.service.get_order_events",
                new_callable=AsyncMock,
                return_value=mock_events,
            ) as mock_get,
        ):
            response = await client.get(f"/api/v1/orders/{order_id}/events")

        assert response.status_code == HTTPStatus.OK
        body = response.json()
        assert len(body["data"]) == 3
        assert body["data"][0]["order_id"] == str(order_id)
        assert body["data"][0]["old_status"] == OrderStatus.PENDING.value
        mock_get.assert_awaited_once()

    @pytest.mark.usefixtures("as_vendor")
    async def test_read_order_events_empty(self, client: AsyncClient) -> None:
        order_id = uuid.uuid4()
        mock_order = _make_mock_order(order_id)

        with (
            patch(
                "features.orders.api.order.service.get_order_by_identifier",
                new_callable=AsyncMock,
                return_value=mock_order,
            ),
            patch(
                "features.orders.api.order.verify_order_read_access",
                new_callable=AsyncMock,
            ),
            patch(
                "features.orders.api.order.service.get_order_events",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            response = await client.get(f"/api/v1/orders/{order_id}/events")

        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"] == []

    async def test_read_order_events_requires_auth(self, client: AsyncClient) -> None:
        response = await client.get(f"/api/v1/orders/{uuid.uuid4()}/events")
        assert response.status_code == HTTPStatus.UNAUTHORIZED

    @pytest.mark.usefixtures("as_user")
    async def test_read_order_events_customer_denied(self, client: AsyncClient) -> None:
        order_id = uuid.uuid4()
        mock_order = _make_mock_order(order_id, user_id=uuid.uuid4())

        with patch(
            "features.orders.api.order.service.get_order_by_identifier",
            new_callable=AsyncMock,
            return_value=mock_order,
        ):
            response = await client.get(f"/api/v1/orders/{order_id}/events")

        assert response.status_code == HTTPStatus.FORBIDDEN

    @pytest.mark.usefixtures("as_vendor")
    async def test_read_order_events_not_found(self, client: AsyncClient) -> None:
        with patch(
            "features.orders.api.order.service.get_order_by_identifier",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.get(f"/api/v1/orders/{uuid.uuid4()}/events")

        assert response.status_code == HTTPStatus.NOT_FOUND


class TestUpdateOrderStatusWithTransitionValidation:
    @pytest.mark.usefixtures("as_vendor")
    async def test_invalid_transition_returns_422(self, client: AsyncClient) -> None:
        order_id = uuid.uuid4()
        mock_order = Order()
        mock_order.id = order_id

        app.dependency_overrides[get_order_for_staff_or_vendor] = lambda: mock_order
        try:
            with patch(
                "features.orders.api.order.service.change_order_status",
                new_callable=AsyncMock,
                side_effect=InvalidStatusTransitionException(),
            ):
                response = await client.patch(
                    f"/api/v1/orders/{order_id}/status",
                    json={"status": OrderStatus.COMPLETED.value},
                )
        finally:
            app.dependency_overrides.pop(get_order_for_staff_or_vendor, None)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY
