import uuid
from unittest.mock import AsyncMock, patch

import pytest
from factories import make_user
from httpx import AsyncClient


class TestUsersAPI:
    @pytest.mark.asyncio
    async def test_get_user_by_id(self, client: AsyncClient):
        user_id = uuid.uuid4()
        mock_user = make_user(user_id=user_id, name="Target User")

        with patch(
            "features.users.api.get_user_by_id_or_404",
            new_callable=AsyncMock,
            return_value=mock_user,
        ) as mock_get:
            response = await client.get(f"/api/v1/users/{user_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user_id)
        assert data["name"] == "Target User"
        mock_get.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_get_my_profile(self, client: AsyncClient, as_user):
        response = await client.get("/api/v1/users/")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(as_user.id)
        assert data["name"] == as_user.name
