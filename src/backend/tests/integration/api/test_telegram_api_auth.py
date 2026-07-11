import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from features.telegram.schemas import (
    TelegramCheckResponse,
)


def _make_tokens():
    m = MagicMock()
    m.access_token = "access-tok"
    m.refresh_token = "refresh-tok"
    m.token_type = "bearer"
    return m


class _FakeUser:
    def __init__(self):
        self.id = uuid.uuid4()
        self.name = "Test User"
        self.phone_number = "79001234567"
        self.email = None
        self.telegram_username = "test_tg"
        self.telegram_id = None
        self.permissions = []
        self.has_password = False
        self.first_name = None
        self.last_name = None
        self.middle_name = None
        self.is_active = True
        self.created_at = None


def _make_user_read():
    return _FakeUser()


class TestTelegramCheck:
    @pytest.mark.asyncio
    async def test_check_unregistered_user(self, client: AsyncClient):
        check_result = TelegramCheckResponse(status="not_registered")
        with patch(
            "features.telegram.api.webapp.webapp_auth.telegram_check",
            new_callable=AsyncMock,
            return_value=check_result,
        ):
            response = await client.post(
                "/api/v1/telegram/check",
                json={"init_data": "test_init_data"},
            )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["status"] == "not_registered"

    @pytest.mark.asyncio
    async def test_check_registered_user(self, client: AsyncClient):
        check_result = TelegramCheckResponse(status="registered", phone_number="79001234567")
        with patch(
            "features.telegram.api.webapp.webapp_auth.telegram_check",
            new_callable=AsyncMock,
            return_value=check_result,
        ):
            response = await client.post(
                "/api/v1/telegram/check",
                json={"init_data": "registered_init_data"},
            )
        assert response.status_code == 200
        assert response.json()["data"]["status"] == "registered"


class TestTelegramSiteLoginRequestCode:
    @pytest.mark.asyncio
    async def test_request_code_success(self, client: AsyncClient):
        with patch(
            "features.telegram.api.webapp.site_login.request_site_login_code",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.post(
                "/api/v1/telegram/site-login/request-code",
                json={"phone_number": "79001234567"},
            )
        assert response.status_code == 200
        assert "message" in response.json()["data"]

    @pytest.mark.asyncio
    async def test_request_code_by_username_success(self, client: AsyncClient):
        with patch(
            "features.telegram.api.webapp.site_login.request_site_login_code_by_username",
            new_callable=AsyncMock,
            return_value=None,
        ):
            response = await client.post(
                "/api/v1/telegram/site-login/request-code-by-username",
                json={"telegram_username": "ivan_tg"},
            )
        assert response.status_code == 200


class TestTelegramSiteLoginVerify:
    @pytest.mark.asyncio
    async def test_verify_success(self, client: AsyncClient):
        tokens = _make_tokens()
        with patch(
            "features.telegram.api.webapp.site_login.verify_site_login_code",
            new_callable=AsyncMock,
            return_value=tokens,
        ):
            response = await client.post(
                "/api/v1/telegram/site-login/verify",
                json={"phone_number": "79001234567", "code": "123456"},
            )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["access_token"] == "access-tok"

    @pytest.mark.asyncio
    async def test_verify_by_username_success(self, client: AsyncClient):
        tokens = _make_tokens()
        with patch(
            "features.telegram.api.webapp.site_login.verify_site_login_code_by_username",
            new_callable=AsyncMock,
            return_value=tokens,
        ):
            response = await client.post(
                "/api/v1/telegram/site-login/verify-by-username",
                json={"telegram_username": "ivan_tg", "code": "654321"},
            )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["access_token"] == "access-tok"


class TestTelegramRegister:
    @pytest.mark.asyncio
    async def test_register_new_user(self, client: AsyncClient):
        tokens = _make_tokens()
        with patch(
            "features.telegram.api.webapp.webapp_auth.telegram_register",
            new_callable=AsyncMock,
            return_value=tokens,
        ):
            response = await client.post(
                "/api/v1/telegram/register",
                json={
                    "init_data": "register_init_data",
                    "phone_number": "79009876543",
                    "name": "Новый Пользователь",
                },
            )
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["access_token"] == "access-tok"


class TestTelegramAuth:
    @pytest.mark.asyncio
    async def test_auth_existing_user(self, client: AsyncClient):
        tokens = _make_tokens()
        with patch(
            "features.telegram.api.webapp.webapp_auth.telegram_auth_existing",
            new_callable=AsyncMock,
            return_value=tokens,
        ):
            response = await client.post(
                "/api/v1/telegram/auth",
                json={"init_data": "auth_init_data"},
            )
        assert response.status_code == 200
        assert response.json()["data"]["access_token"] == "access-tok"


class TestTelegramSetPassword:
    @pytest.mark.asyncio
    async def test_set_password_requires_auth(self, client: AsyncClient):
        response = await client.post(
            "/api/v1/telegram/site-login/password",
            json={"password": "NewPass123!"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_set_password_as_user(self, client: AsyncClient, as_user):
        user = _make_user_read()
        with patch(
            "features.telegram.api.webapp.site_login.set_site_password",
            new_callable=AsyncMock,
            return_value=user,
        ):
            response = await client.post(
                "/api/v1/telegram/site-login/password",
                json={"password": "StrongPass1!"},
            )
        assert response.status_code == 200


class TestTelegramLogout:
    @pytest.mark.asyncio
    async def test_logout_requires_auth(self, client: AsyncClient):
        response = await client.post("/api/v1/telegram/logout")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_logout_as_user(self, client: AsyncClient, as_user):
        user = _make_user_read()
        with patch(
            "features.telegram.api.webapp.webapp_auth.unlink_telegram_for_user",
            new_callable=AsyncMock,
            return_value=user,
        ):
            response = await client.post("/api/v1/telegram/logout")
        assert response.status_code == 200
