import time
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest

from features.auth.service import (
    logout_user,
    refresh_user_token,
    register_user,
)
from shared.exceptions.existence import AuthException


class TestLogoutUser:
    @pytest.mark.asyncio
    async def test_deletes_both_cookies(self):
        request = MagicMock()
        request.cookies = {}
        request.headers = {}
        response = MagicMock()

        await logout_user(request, response)

        assert response.delete_cookie.call_count == 2
        calls = [call[0][0] for call in response.delete_cookie.call_args_list]
        assert "access_token" in calls
        assert "refresh_token" in calls

    @pytest.mark.asyncio
    async def test_blacklists_valid_access_token(self):
        access_token = "valid_access"
        now = int(time.time())
        request = MagicMock()
        request.cookies = {"access_token": access_token}
        request.headers = {}
        response = MagicMock()

        mock_cache = MagicMock()
        mock_cache.set = AsyncMock()

        with patch(
            "features.auth.service.decode_jwt",
            return_value={"exp": now + 3600, "typ": "access", "jti": "jti1"},
        ):
            await logout_user(request, response, cache=mock_cache)

        mock_cache.set.assert_awaited()

    @pytest.mark.asyncio
    async def test_logout_ignores_invalid_token_error(self):
        request = MagicMock()
        request.cookies = {"access_token": "bad_token"}
        request.headers = {}
        response = MagicMock()

        mock_cache = MagicMock()

        with patch("features.auth.service.decode_jwt", side_effect=jwt.InvalidTokenError):
            await logout_user(request, response, cache=mock_cache)

        response.delete_cookie.assert_called()


class TestRegisterUser:
    @pytest.mark.asyncio
    async def test_register_user(self):
        from features.users.schemas import UserCreate

        data = UserCreate(name="Test", phone_number="+79001234567", password="Password1")
        mock_user = MagicMock()

        with (
            patch("features.auth.service.ensure_user_not_exists_by_phone", new_callable=AsyncMock),
            patch(
                "features.auth.service.users_crud.create_user",
                new_callable=AsyncMock,
                return_value=mock_user,
            ),
            patch("features.users.schemas.UserRead.model_validate", return_value=MagicMock()),
        ):
            result = await register_user(AsyncMock(), data)
        assert result is not None


class TestRefreshUserToken:
    @pytest.mark.asyncio
    async def test_no_token_raises(self):
        request = MagicMock()
        request.cookies = {}
        request.headers = {}
        with pytest.raises(AuthException, match="missing"):
            await refresh_user_token(request, MagicMock(), AsyncMock())

    @pytest.mark.asyncio
    async def test_expired_refresh_raises(self):
        request = MagicMock()
        request.cookies = {"refresh_token": "old"}
        request.headers = {}

        with patch("features.auth.service.decode_jwt", side_effect=jwt.ExpiredSignatureError):
            with pytest.raises(AuthException, match="expired"):
                await refresh_user_token(request, MagicMock(), AsyncMock())

    @pytest.mark.asyncio
    async def test_wrong_type_raises(self):
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        with patch(
            "features.auth.service.decode_jwt",
            return_value={"typ": "access", "sub": "id", "exp": 9999999999},
        ):
            with pytest.raises(AuthException, match="token type"):
                await refresh_user_token(request, MagicMock(), AsyncMock())

    @pytest.mark.asyncio
    async def test_session_expired_raises(self):
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        with patch(
            "features.auth.service.decode_jwt",
            return_value={
                "typ": "refresh",
                "sub": "00000000-0000-0000-0000-000000000001",
                "exp": 9999999999,
                "session_exp": int(time.time()) - 1000,
            },
        ):
            with pytest.raises(AuthException, match="Session has expired"):
                await refresh_user_token(request, MagicMock(), AsyncMock())

    @pytest.mark.asyncio
    async def test_already_used_raises(self):
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        mock_cache = MagicMock()
        mock_cache.set_nx = AsyncMock(return_value=False)

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={
                    "typ": "refresh",
                    "sub": "00000000-0000-0000-0000-000000000001",
                    "exp": int(time.time()) + 3600,
                    "jti": "jti1",
                },
            ),
            patch("features.auth.service.get_redis_cache", return_value=mock_cache),
        ):
            with pytest.raises(AuthException, match="already used"):
                await refresh_user_token(request, MagicMock(), AsyncMock(), cache=mock_cache)

    @pytest.mark.asyncio
    async def test_success(self):
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        user = MagicMock()
        user.is_active = True
        mock_cache = MagicMock()
        mock_cache.set_nx = AsyncMock(return_value=True)

        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={
                    "typ": "refresh",
                    "sub": "00000000-0000-0000-0000-000000000001",
                    "exp": int(time.time()) + 3600,
                    "jti": "jti1",
                },
            ),
            patch(
                "features.auth.service.get_user_by_id_or_404",
                new_callable=AsyncMock,
                return_value=user,
            ),
            patch("features.auth.service.create_access_token", return_value="new_access"),
            patch("features.auth.service.create_refresh_token", return_value="new_refresh"),
            patch("features.auth.service._set_auth_cookies"),
        ):
            result = await refresh_user_token(request, MagicMock(), AsyncMock(), cache=mock_cache)

        assert result.access_token == "new_access"
