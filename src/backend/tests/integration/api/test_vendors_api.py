from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


class TestVendorsAPI:
    @pytest.mark.asyncio
    async def test_create_vendor(self, client: AsyncClient, as_user):
        mock_vendor = {"description": "Best food here"}

        with patch(
            "features.vendors.api.add_vendors_profile",
            new_callable=AsyncMock,
            return_value=mock_vendor,
        ) as mock_add:
            response = await client.post("/api/v1/vendors/", json={"description": "Best food here"})

        assert response.status_code == 200
        assert response.json() == mock_vendor
        mock_add.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_my_profile(self, vendor_client):
        client, vendor_profile = vendor_client
        vendor_profile.description = "Test Desc"

        response = await client.get("/api/v1/vendors/")
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Test Desc"

    @pytest.mark.asyncio
    async def test_update_description(self, vendor_client):
        client, vendor_profile = vendor_client
        mock_updated = {"description": "New Desc"}

        with patch(
            "features.vendors.api.update_vendor_details",
            new_callable=AsyncMock,
            return_value=mock_updated,
        ) as mock_update:
            response = await client.patch(
                "/api/v1/vendors/description", params={"new_description": "New Desc"}
            )

        assert response.status_code == 200
        assert response.json()["description"] == "New Desc"
        mock_update.assert_awaited_once()
