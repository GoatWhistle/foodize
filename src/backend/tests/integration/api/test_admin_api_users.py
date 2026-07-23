import uuid
from http import HTTPStatus
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from pydantic import JsonValue

from shared.enums.permissions import Permission


def _make_admin_user_dict(user_id: uuid.UUID | None = None) -> dict[str, JsonValue]:
    return {
        "id": str(user_id or uuid.uuid4()),
        "name": "Admin",
        "phone_number": "79000000000",
        "permissions": [Permission.ORDERS_CREATE.value],
        "is_active": True,
        "created_at": "2026-01-01T00:00:00",
    }


class TestAdminAccess:
    async def test_requires_auth(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == HTTPStatus.UNAUTHORIZED

    @pytest.mark.usefixtures("as_user")
    async def test_requires_admin_role(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == HTTPStatus.FORBIDDEN

    @pytest.mark.usefixtures("as_vendor")
    async def test_vendor_denied(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/admin/users")
        assert response.status_code == HTTPStatus.FORBIDDEN


class TestAdminUsers:
    @pytest.mark.usefixtures("as_admin")
    async def test_read_users(self, client: AsyncClient) -> None:
        mock_users = [_make_admin_user_dict() for _ in range(3)]

        with (
            patch(
                "features.admin.crud.get_all_users",
                new_callable=AsyncMock,
                return_value=mock_users,
            ),
            patch(
                "features.admin.crud.count_all_users",
                new_callable=AsyncMock,
                return_value=3,
            ),
        ):
            response = await client.get("/api/v1/admin/users")

        assert response.status_code == HTTPStatus.OK
        body = response.json()
        assert len(body["data"]) == 3
        assert body["pagination"]["total"] == 3

    @pytest.mark.usefixtures("as_admin")
    async def test_read_users_filter_by_role(self, client: AsyncClient) -> None:
        with (
            patch(
                "features.admin.crud.get_all_users",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.admin.crud.count_all_users",
                new_callable=AsyncMock,
                return_value=0,
            ),
        ):
            response = await client.get("/api/v1/admin/users?role=VENDOR")

        assert response.status_code == HTTPStatus.OK
        assert response.json()["pagination"]["total"] == 0

    @pytest.mark.usefixtures("as_admin")
    async def test_read_user_by_id(self, client: AsyncClient) -> None:
        user_id = uuid.uuid4()
        mock_user = _make_admin_user_dict(user_id)

        with patch(
            "features.admin.crud.get_user_by_id",
            new_callable=AsyncMock,
            return_value=mock_user,
        ):
            response = await client.get(f"/api/v1/admin/users/{user_id}")

        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["id"] == str(user_id)

    @pytest.mark.usefixtures("as_admin")
    async def test_read_user_not_found(self, client: AsyncClient) -> None:
        with patch(
            "features.admin.crud.get_user_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.get(f"/api/v1/admin/users/{uuid.uuid4()}")

        assert response.status_code == HTTPStatus.NOT_FOUND

    @pytest.mark.usefixtures("as_admin")
    async def test_delete_user(self, client: AsyncClient) -> None:
        user_id = uuid.uuid4()
        mock_user = _make_admin_user_dict(user_id)
        deactivated = {**mock_user, "is_active": False}

        with (
            patch(
                "features.admin.crud.get_user_by_id",
                new_callable=AsyncMock,
                return_value=mock_user,
            ),
            patch(
                "features.admin.crud.deactivate_user",
                new_callable=AsyncMock,
                return_value=deactivated,
            ),
        ):
            response = await client.delete(f"/api/v1/admin/users/{user_id}")

        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["is_active"] is False

    @pytest.mark.usefixtures("as_admin")
    async def test_delete_user_not_found(self, client: AsyncClient) -> None:
        with patch(
            "features.admin.crud.get_user_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.delete(f"/api/v1/admin/users/{uuid.uuid4()}")

        assert response.status_code == HTTPStatus.NOT_FOUND

    @pytest.mark.usefixtures("as_admin")
    async def test_activate_user(self, client: AsyncClient) -> None:
        user_id = uuid.uuid4()
        mock_user = _make_admin_user_dict(user_id)
        activated = {**mock_user, "is_active": True}

        with (
            patch(
                "features.admin.crud.get_user_by_id",
                new_callable=AsyncMock,
                return_value=mock_user,
            ),
            patch(
                "features.admin.crud.activate_user",
                new_callable=AsyncMock,
                return_value=activated,
            ),
        ):
            response = await client.post(f"/api/v1/admin/users/{user_id}/activate")

        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["is_active"] is True

    @pytest.mark.usefixtures("as_admin")
    async def test_grant_admin_permissions(self, client: AsyncClient) -> None:
        user_id = uuid.uuid4()
        mock_user = _make_admin_user_dict(user_id)
        promoted = {**mock_user, "permissions": [Permission.ADMIN_ACCESS.value]}

        with patch(
            "features.admin.api.users.users_service.set_user_permissions",
            new_callable=AsyncMock,
            return_value=promoted,
        ):
            response = await client.post(f"/api/v1/admin/users/{user_id}/grant-admin")

        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["permissions"] == [Permission.ADMIN_ACCESS.value]
