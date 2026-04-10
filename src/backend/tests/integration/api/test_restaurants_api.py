import uuid
from unittest.mock import AsyncMock, patch

import pytest


class TestRestaurantsAPI:
    @pytest.mark.asyncio
    async def test_create_restaurant(self, vendor_client):
        client, vendor_profile = vendor_client

        mock_restaurant = {
            "id": str(uuid.uuid4()),
            "name": "New Sushi",
            "address": "Street 1",
            "vendor_id": str(uuid.uuid4()),
        }

        with patch(
            "features.restaurants.api.register_new_restaurant",
            new_callable=AsyncMock,
            return_value=mock_restaurant,
        ) as mock_register:
            response = await client.post(
                "/api/v1/restaurants/", json={"name": "New Sushi", "address": "Street 1"}
            )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Sushi"
        mock_register.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_update_restaurant(self, vendor_client):
        client, vendor_profile = vendor_client
        restaurant_id = uuid.uuid4()

        mock_restaurant = {
            "id": str(restaurant_id),
            "name": "Updated Sushi",
            "address": "Street 1",
            "vendor_id": str(uuid.uuid4()),
        }

        with patch(
            "features.restaurants.api.update_restaurant_logic",
            new_callable=AsyncMock,
            return_value=mock_restaurant,
        ) as mock_update:
            response = await client.patch(
                f"/api/v1/restaurants/{restaurant_id}", json={"name": "Updated Sushi"}
            )

        assert response.status_code == 200
        assert response.json()["name"] == "Updated Sushi"
        mock_update.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_restaurants(self, vendor_client):
        client, vendor_profile = vendor_client

        with patch(
            "features.restaurants.api.get_my_restaurants", new_callable=AsyncMock, return_value=[]
        ) as mock_get:
            response = await client.get("/api/v1/restaurants/")

        assert response.status_code == 200
        assert response.json() == []
        mock_get.assert_awaited_once()
