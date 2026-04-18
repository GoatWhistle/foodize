import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


def _make_admin_user_dict(user_id: uuid.UUID | None = None) -> dict:
    return {
        "id": str(user_id or uuid.uuid4()),
        "name": "Admin",
        "phone_number": "79000000000",
        "user_role": UserRole.CUSTOMER.value,
        "is_active": True,
        "created_at": "2026-01-01T00:00:00",
    }


class TestAdminAccess:
    @pytest.mark.asyncio
    async def test_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_requires_admin_role(self, client: AsyncClient, as_user):
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_vendor_denied(self, client: AsyncClient, as_vendor):
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == 403


class TestAdminUsers:
    @pytest.mark.asyncio
    async def test_read_users(self, client: AsyncClient, as_admin):
        mock_users = [_make_admin_user_dict() for _ in range(3)]

        with (
            patch(
                "features.admin.api.get_all_users",
                new_callable=AsyncMock,
                return_value=mock_users,
            ),
            patch(
                "features.admin.api.count_all_users",
                new_callable=AsyncMock,
                return_value=3,
            ),
        ):
            response = await client.get("/api/v1/admin/users")

        assert response.status_code == 200
        body = response.json()
        assert len(body["data"]) == 3
        assert body["pagination"]["total"] == 3

    @pytest.mark.asyncio
    async def test_read_users_filter_by_role(self, client: AsyncClient, as_admin):
        with (
            patch(
                "features.admin.api.get_all_users",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.admin.api.count_all_users",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            response = await client.get("/api/v1/admin/users?role=VENDOR")

        assert response.status_code == 200
        assert response.json()["pagination"]["total"] == 0

    @pytest.mark.asyncio
    async def test_read_user_by_id(self, client: AsyncClient, as_admin):
        user_id = uuid.uuid4()
        mock_user = _make_admin_user_dict(user_id)

        with patch(
            "features.admin.api.get_user_by_id",
            new_callable=AsyncMock,
            return_value=mock_user,
        ):
            response = await client.get(f"/api/v1/admin/users/{user_id}")

        assert response.status_code == 200
        assert response.json()["id"] == str(user_id)

    @pytest.mark.asyncio
    async def test_read_user_not_found(self, client: AsyncClient, as_admin):
        with patch(
            "features.admin.api.get_user_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.get(f"/api/v1/admin/users/{uuid.uuid4()}")

        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_user(self, client: AsyncClient, as_admin):
        user_id = uuid.uuid4()
        mock_user = _make_admin_user_dict(user_id)
        deactivated = {**mock_user, "is_active": False}

        with (
            patch(
                "features.admin.api.get_user_by_id",
                new_callable=AsyncMock,
                return_value=mock_user,
            ),
            patch(
                "features.admin.api.deactivate_user",
                new_callable=AsyncMock,
                return_value=deactivated,
            ),
        ):
            response = await client.delete(f"/api/v1/admin/users/{user_id}")

        assert response.status_code == 200
        assert response.json()["is_active"] is False

    @pytest.mark.asyncio
    async def test_delete_user_not_found(self, client: AsyncClient, as_admin):
        with patch(
            "features.admin.api.get_user_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.delete(f"/api/v1/admin/users/{uuid.uuid4()}")

        assert response.status_code == 404


class TestAdminOrders:
    @pytest.mark.asyncio
    async def test_read_orders(self, client: AsyncClient, as_admin):
        mock_orders = [
            {
                "id": str(uuid.uuid4()),
                "user_id": str(uuid.uuid4()),
                "restaurant_id": str(uuid.uuid4()),
                "status": OrderStatus.PENDING.value,
                "total_price": 500,
                "items": [],
            }
        ]

        with (
            patch(
                "features.admin.api.get_all_orders",
                new_callable=AsyncMock,
                return_value=mock_orders,
            ),
            patch(
                "features.admin.api.count_all_orders",
                new_callable=AsyncMock,
                return_value=1,
            ),
        ):
            response = await client.get("/api/v1/admin/orders")

        assert response.status_code == 200
        body = response.json()
        assert len(body["data"]) == 1
        assert body["pagination"]["total"] == 1

    @pytest.mark.asyncio
    async def test_read_orders_with_filters(self, client: AsyncClient, as_admin):
        with (
            patch(
                "features.admin.api.get_all_orders",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.admin.api.count_all_orders",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            response = await client.get("/api/v1/admin/orders?status=PENDING")

        assert response.status_code == 200
        assert response.json()["pagination"]["total"] == 0


class TestAdminStats:
    @pytest.mark.asyncio
    async def test_read_stats(self, client: AsyncClient, as_admin):
        mock_stats = {
            "users_by_role": {"CUSTOMER": 10, "VENDOR": 3, "ADMIN": 1},
            "orders_by_status": {"PENDING": 5, "COMPLETED": 20},
            "total_restaurants": 4,
        }

        with patch(
            "features.admin.api.get_platform_stats",
            new_callable=AsyncMock,
            return_value=mock_stats,
        ):
            response = await client.get("/api/v1/admin/stats")

        assert response.status_code == 200
        data = response.json()
        assert data["total_restaurants"] == 4
        assert data["users_by_role"]["CUSTOMER"] == 10
        assert data["orders_by_status"]["COMPLETED"] == 20
