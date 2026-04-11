import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from shared.enums.order_status import OrderStatus


class TestOrdersAPI:
    @pytest.mark.asyncio
    async def test_create_order(self, client: AsyncClient, as_user):
        order_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        menu_item_id = uuid.uuid4()

        mock_order = {
            "id": str(order_id),
            "user_id": str(as_user.id),
            "restaurant_id": str(restaurant_id),
            "status": OrderStatus.PENDING.value,
            "total_price": 500,
            "items": [
                {
                    "id": str(uuid.uuid4()),
                    "menu_item_id": str(menu_item_id),
                    "quantity": 2,
                    "price_at_purchase": 250,
                }
            ],
        }

        with patch(
            "features.orders.api.order.place_order", new_callable=AsyncMock, return_value=mock_order
        ) as mock_place:
            response = await client.post(
                "/api/v1/orders/",
                json={
                    "restaurant_id": str(restaurant_id),
                    "items": [{"menu_item_id": str(menu_item_id), "quantity": 2}],
                },
            )

        assert response.status_code == 201
        data = response.json()
        assert data["id"] == str(order_id)
        mock_place.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_my_orders(self, client: AsyncClient, as_user):
        with patch(
            "features.orders.api.order.get_user_orders", new_callable=AsyncMock, return_value=[]
        ) as mock_get_all:
            response = await client.get("/api/v1/orders/me")

        assert response.status_code == 200
        assert response.json() == []
        mock_get_all.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_order_by_id(self, client: AsyncClient, as_user):
        order_id = uuid.uuid4()
        mock_order = {
            "id": str(order_id),
            "user_id": str(as_user.id),
            "restaurant_id": str(uuid.uuid4()),
            "status": OrderStatus.PENDING.value,
            "total_price": 100,
            "items": [],
        }

        with patch(
            "features.orders.api.order.get_order_for_user",
            new_callable=AsyncMock,
            return_value=mock_order,
        ) as mock_get:
            response = await client.get(f"/api/v1/orders/{order_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(order_id)
        mock_get.assert_awaited_once()
