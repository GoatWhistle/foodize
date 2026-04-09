from unittest.mock import AsyncMock, patch

import pytest

from features.users.models import User
from shared.enums.roles import UserRole


@pytest.mark.asyncio
async def test_register_user(client, mock_db_session):
    with patch("features.auth.service.ensure_user_not_exists_by_phone", new_callable=AsyncMock):
        mock_user = User(
            id=1,
            name="Test User",
            phone_number="1234567890",
            hashed_password="hashed_password",
            user_role=UserRole.CUSTOMER,
        )
        with patch("features.auth.service.create_user", new_callable=AsyncMock) as mock_create:
            mock_create.return_value = mock_user
            response = await client.post(
                "/api/v1/register",
                json={
                    "name": "Test User",
                    "phone_number": "1234567890",
                    "password": "testpassword",
                    "user_role": "CUSTOMER",
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert data["name"] == "Test User"
            assert data["phone_number"] == "1234567890"
            assert "id" in data


@pytest.mark.asyncio
async def test_login_user(client, mock_db_session):
    mock_user = User(
        id=1,
        name="Test User",
        phone_number="1234567890",
        hashed_password="hashed_password",
        user_role=UserRole.CUSTOMER,
    )
    with patch(
        "features.auth.service.get_user_by_phone_or_401", new_callable=AsyncMock
    ) as mock_get:
        mock_get.return_value = mock_user
        with (
            patch("features.auth.service.create_access_token", return_value="access_token"),
            patch("features.auth.service.create_refresh_token", return_value="refresh_token"),
        ):
            response = await client.post(
                "/api/v1/login", json={"phone_number": "1234567890", "password": "testpassword"}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["access_token"] == "access_token"
            assert data["refresh_token"] == "refresh_token"
            assert response.cookies.get("access_token") == "access_token"
