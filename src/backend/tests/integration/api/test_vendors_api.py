import uuid
from http import HTTPStatus
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from features.users.models import User
from features.vendors.models import VendorProfile
from shared.enums.moderation_status import ModerationStatus


class TestVendorsAPI:
    async def test_create_vendor(self, client: AsyncClient, as_vendor: User) -> None:
        mock_vendor = {
            "id": str(uuid.uuid4()),
            "user_id": str(as_vendor.id),
            "approval_status": ModerationStatus.PENDING.value,
            "rejection_reason": None,
        }

        with patch(
            "features.vendors.api.service.register_vendor",
            new_callable=AsyncMock,
            return_value=mock_vendor,
        ) as mock_add:
            response = await client.post("/api/v1/vendors/", json={})

        assert response.status_code == HTTPStatus.CREATED
        assert response.json()["data"]["approval_status"] == ModerationStatus.PENDING.value
        mock_add.assert_awaited_once()

    async def test_read_my_vendor_profile(
        self, vendor_client: tuple[AsyncClient, VendorProfile]
    ) -> None:
        client, vendor_profile = vendor_client
        vendor_profile.approval_status = ModerationStatus.APPROVED.value

        response = await client.get("/api/v1/vendors/")
        assert response.status_code == HTTPStatus.OK
        data = response.json()["data"]
        assert data["approval_status"] == ModerationStatus.APPROVED.value

    @pytest.mark.usefixtures("as_user")
    async def test_create_vendor_requires_permission(self, client: AsyncClient) -> None:
        response = await client.post("/api/v1/vendors/", json={})
        assert response.status_code == HTTPStatus.FORBIDDEN

    async def test_create_vendor_requires_auth(self, client: AsyncClient) -> None:
        response = await client.post("/api/v1/vendors/", json={"description": "x"})
        assert response.status_code == HTTPStatus.UNAUTHORIZED

    async def test_read_my_vendor_requires_auth(self, client: AsyncClient) -> None:
        response = await client.get("/api/v1/vendors/")
        assert response.status_code == HTTPStatus.UNAUTHORIZED
