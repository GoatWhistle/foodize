import uuid
from http import HTTPStatus
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from pydantic import JsonValue

from shared.enums.order_status import OrderStatus
from shared.enums.permissions import Permission

MOCK_CREATED_AT = "2026-01-01T00:00:00"


def _make_admin_order_dict() -> dict[str, JsonValue]:
    return {
        "id": str(uuid.uuid4()),
        "display_id": 1001,
        "user_id": str(uuid.uuid4()),
        "restaurant_id": str(uuid.uuid4()),
        "status": OrderStatus.PENDING.value,
        "total_price": 500,
        "created_at": MOCK_CREATED_AT,
        "items": [],
    }


class TestAdminOrders:
    @pytest.mark.usefixtures("as_admin")
    async def test_read_orders(self, client: AsyncClient) -> None:
        mock_orders = [_make_admin_order_dict()]

        with (
            patch(
                "features.admin.crud.get_all_orders",
                new_callable=AsyncMock,
                return_value=mock_orders,
            ),
            patch(
                "features.admin.crud.count_all_orders",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            response = await client.get("/api/v1/admin/orders")

        assert response.status_code == HTTPStatus.OK
        body = response.json()
        assert len(body["data"]) == 1
        assert body["pagination"]["total"] == 1

    @pytest.mark.usefixtures("as_admin")
    async def test_read_orders_with_filters(self, client: AsyncClient) -> None:
        with (
            patch(
                "features.admin.crud.get_all_orders",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.admin.crud.count_all_orders",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            response = await client.get("/api/v1/admin/orders?status=PENDING")

        assert response.status_code == HTTPStatus.OK
        assert response.json()["pagination"]["total"] == 0


class TestAdminStats:
    @pytest.mark.usefixtures("as_admin")
    async def test_read_stats(self, client: AsyncClient) -> None:
        mock_stats = {
            "users_by_permission": {Permission.ORDERS_CREATE.value: 10},
            "users_by_role": {"CUSTOMER": 10, "VENDOR": 3, "ADMIN": 1},
            "total_users": 14,
            "orders_by_status": {"PENDING": 5, "COMPLETED": 20},
            "total_restaurants": 4,
            "total_vendors": 3,
            "growth": {
                "users": [{"date": "2026-01-01", "count": 2}],
                "restaurants": [{"date": "2026-01-01", "count": 1}],
                "orders": [{"date": "2026-01-01", "count": 5}],
                "vendors": [{"date": "2026-01-01", "count": 1}],
            },
        }

        with patch(
            "features.admin.crud.get_platform_stats",
            new_callable=AsyncMock,
            return_value=mock_stats,
        ):
            response = await client.get("/api/v1/admin/stats")

        assert response.status_code == HTTPStatus.OK
        data = response.json()["data"]
        assert data["total_restaurants"] == 4
        assert data["total_vendors"] == 3
        assert data["users_by_role"]["CUSTOMER"] == 10
        assert data["orders_by_status"]["COMPLETED"] == 20
