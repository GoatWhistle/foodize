import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


class TestVendorsAPI:
    @pytest.mark.asyncio
    async def test_create_vendor(self, client: AsyncClient, as_user):
        mock_vendor = {
            "id": str(uuid.uuid4()),
            "user_id": str(uuid.uuid4()),
            "description": "Best food here",
        }

        with patch(
            "features.vendors.api.service.register_vendor",
            new_callable=AsyncMock,
            return_value=mock_vendor,
        ) as mock_add:
            response = await client.post(
                "/api/v1/vendors/", json={"description": "Best food here"}
            )

        assert response.status_code == 201
        assert response.json()["data"]["description"] == "Best food here"
        mock_add.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_read_my_vendor_profile(self, vendor_client):
        client, vendor_profile = vendor_client
        vendor_profile.description = "Test Desc"

        response = await client.get("/api/v1/vendors/")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["description"] == "Test Desc"

    @pytest.mark.asyncio
    async def test_update_description(self, vendor_client):
        client, vendor_profile = vendor_client
        mock_updated = {
            "id": str(uuid.uuid4()),
            "user_id": str(vendor_profile.user_id),
            "description": "New Desc",
        }

        with patch(
            "features.vendors.api.service.update_description",
            new_callable=AsyncMock,
            return_value=mock_updated,
        ) as mock_update:
            response = await client.patch(
                "/api/v1/vendors/description",
                json={"description": "New Desc"},
            )

        assert response.status_code == 200
        assert response.json()["data"]["description"] == "New Desc"
        mock_update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_create_vendor_requires_auth(self, client: AsyncClient):
        response = await client.post("/api/v1/vendors/", json={"description": "x"})
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_read_my_vendor_requires_auth(self, client: AsyncClient):
        response = await client.get("/api/v1/vendors/")
        assert response.status_code == 401
