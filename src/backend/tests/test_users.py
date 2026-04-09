from unittest.mock import AsyncMock, patch
import pytest
from features.auth.service import get_current_user
from features.users.models import User
from main import app
from shared.enums.roles import UserRole
@pytest.mark.asyncio
async def test_get_my_profile(client):
    mock_user = User(
        id=1,
        name="Test User",
        phone_number="1234567890",
        hashed_password="hashed_password",
        user_role=UserRole.CUSTOMER,
    )
    app.dependency_overrides[get_current_user] = lambda: mock_user
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test User"
    assert data["phone_number"] == "1234567890"
    app.dependency_overrides.clear()
@pytest.mark.asyncio
async def test_get_user_by_id(client, mock_db_session):
    mock_user = User(
        id=1,
        name="Test User",
        phone_number="1234567890",
        hashed_password="hashed_password",
        user_role=UserRole.CUSTOMER,
    )
    with patch("features.users.api.get_user_by_id_or_404", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_user
        response = await client.get("/api/v1/users/1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["name"] == "Test User"
