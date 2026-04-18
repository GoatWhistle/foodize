import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from features.orders.dependencies import get_order_for_staff_or_vendor
from features.orders.exceptions import InvalidStatusTransitionException
from features.orders.models import Order
from main import app
from shared.enums.order_status import OrderStatus
from shared.exceptions import AccessDeniedException


def _make_mock_event(order_id: uuid.UUID) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "order_id": str(order_id),
        "actor_id": str(uuid.uuid4()),
        "actor_role": "VENDOR",
        "old_status": OrderStatus.PENDING.value,
        "new_status": OrderStatus.ACCEPTED.value,
        "created_at": "2026-04-18T12:00:00",
    }


class TestOrderEventsAPI:
    @pytest.mark.asyncio
    async def test_read_order_events_as_vendor(self, client: AsyncClient, as_vendor):
        order_id = uuid.uuid4()
        mock_order = Order()
        mock_order.id = order_id

        mock_events = [_make_mock_event(order_id) for _ in range(3)]

        app.dependency_overrides[get_order_for_staff_or_vendor] = lambda: mock_order

        with patch(
            "features.orders.api.order.service.get_order_events",
            new_callable=AsyncMock,
            return_value=mock_events,
        ) as mock_get:
            response = await client.get(f"/api/v1/orders/{order_id}/events")

        app.dependency_overrides.pop(get_order_for_staff_or_vendor, None)

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        assert data[0]["order_id"] == str(order_id)
        assert data[0]["old_status"] == OrderStatus.PENDING.value
        assert data[0]["new_status"] == OrderStatus.ACCEPTED.value
        mock_get.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_read_order_events_empty(self, client: AsyncClient, as_vendor):
        order_id = uuid.uuid4()
        mock_order = Order()
        mock_order.id = order_id

        app.dependency_overrides[get_order_for_staff_or_vendor] = lambda: mock_order

        with patch(
            "features.orders.api.order.service.get_order_events",
            new_callable=AsyncMock,
            return_value=[],
        ):
            response = await client.get(f"/api/v1/orders/{order_id}/events")

        app.dependency_overrides.pop(get_order_for_staff_or_vendor, None)

        assert response.status_code == 200
        assert response.json() == []

    @pytest.mark.asyncio
    async def test_read_order_events_requires_auth(self, client: AsyncClient):
        response = await client.get(f"/api/v1/orders/{uuid.uuid4()}/events")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_read_order_events_customer_denied(self, client: AsyncClient, as_user):
        def _raise_403():
            raise AccessDeniedException()

        app.dependency_overrides[get_order_for_staff_or_vendor] = _raise_403
        try:
            response = await client.get(f"/api/v1/orders/{uuid.uuid4()}/events")
        finally:
            app.dependency_overrides.pop(get_order_for_staff_or_vendor, None)

        assert response.status_code == 403


class TestUpdateOrderStatusWithTransitionValidation:
    @pytest.mark.asyncio
    async def test_invalid_transition_returns_422(self, client: AsyncClient, as_vendor):

        order_id = uuid.uuid4()
        mock_order = Order()
        mock_order.id = order_id

        app.dependency_overrides[get_order_for_staff_or_vendor] = lambda: mock_order

        with patch(
            "features.orders.api.order.service.change_order_status",
            new_callable=AsyncMock,
            side_effect=InvalidStatusTransitionException(),
        ):
            response = await client.patch(
                f"/api/v1/orders/{order_id}/status",
                json={"status": OrderStatus.COMPLETED.value},
            )

        app.dependency_overrides.pop(get_order_for_staff_or_vendor, None)

        assert response.status_code == 422
