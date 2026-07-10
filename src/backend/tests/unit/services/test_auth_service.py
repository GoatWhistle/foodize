from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import jwt

from features.auth.service import (
    OAuth2PasswordBearerWithCookie,
    _get_bearer_token,
    get_current_user,
    issue_user_tokens,
    login_user,
    logout_user,
    refresh_user_token,
    register_user,
)
from shared.exceptions.existence import AuthException


class TestOAuth2PasswordBearerWithCookie:
    @pytest.mark.asyncio
    async def test_returns_cookie_token(self):
        scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/token", auto_error=False)
        request = MagicMock()
        request.cookies = {"access_token": "cookie_token"}

        result = await scheme(request)
        assert result == "cookie_token"

    @pytest.mark.asyncio
    async def test_returns_bearer_header_when_no_cookie(self):
        scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/token", auto_error=False)
        request = MagicMock()
        request.cookies = {}
        request.headers = {"Authorization": "Bearer header_token"}

        with patch.object(
            OAuth2PasswordBearerWithCookie.__bases__[0],
            "__call__",
            new_callable=AsyncMock,
            return_value="header_token",
        ):
            result = await scheme(request)
            assert result == "header_token"

    @pytest.mark.asyncio
    async def test_returns_none_when_no_token(self):
        scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/token", auto_error=False)
        request = MagicMock()
        request.cookies = {}
        request.headers = {}

        with patch.object(
            OAuth2PasswordBearerWithCookie.__bases__[0],
            "__call__",
            new_callable=AsyncMock,
            return_value=None,
        ):
            result = await scheme(request)
            assert result is None


class TestGetCurrentUserDeactivated:
    @pytest.mark.asyncio
    async def test_inactive_user_raises(self):
        user = MagicMock()
        user.is_active = False

        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=False)
        with (
            patch(
                "features.auth.service.decode_jwt",
                return_value={"sub": "00000000-0000-0000-0000-000000000001", "typ": "access"},
            ),
            patch(
                "features.auth.service.get_user_by_id_or_404",
                new_callable=AsyncMock,
                return_value=user,
            ),
        ):
            with pytest.raises(AuthException):
                await get_current_user("some_token", AsyncMock(), cache=mock_cache)


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
        import time
        access_token = "valid_access"
        now = int(time.time())
        request = MagicMock()
        request.cookies = {"access_token": access_token}
        request.headers = {}
        response = MagicMock()

        mock_cache = MagicMock()
        mock_cache.set = AsyncMock()

        with patch("features.auth.service.decode_jwt", return_value={"exp": now + 3600, "typ": "access", "jti": "jti1"}):
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


class TestGetCurrentUser:
    @pytest.mark.asyncio
    async def test_no_token_raises(self):
        with pytest.raises(AuthException, match="Not authenticated"):
            await get_current_user(token=None, session=AsyncMock())

    @pytest.mark.asyncio
    async def test_expired_token_raises(self):
        with patch("features.auth.service.decode_jwt", side_effect=jwt.ExpiredSignatureError):
            with pytest.raises(AuthException, match="expired"):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_invalid_token_raises(self):
        with patch("features.auth.service.decode_jwt", side_effect=jwt.InvalidTokenError):
            with pytest.raises(AuthException, match="Invalid token"):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_wrong_token_type_raises(self):
        with patch("features.auth.service.decode_jwt", return_value={"sub": "id", "typ": "refresh"}):
            with pytest.raises(AuthException, match="token type"):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_no_sub_raises(self):
        with patch("features.auth.service.decode_jwt", return_value={"typ": "access"}):
            with pytest.raises(AuthException):
                await get_current_user(token="tok", session=AsyncMock())

    @pytest.mark.asyncio
    async def test_blacklisted_token_raises(self):
        user = MagicMock()
        user.is_active = True
        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=True)

        with (
            patch("features.auth.service.decode_jwt", return_value={"sub": "00000000-0000-0000-0000-000000000001", "typ": "access", "jti": "jti1"}),
        ):
            with pytest.raises(AuthException, match="invalidated"):
                await get_current_user(token="tok", session=AsyncMock(), cache=mock_cache)

    @pytest.mark.asyncio
    async def test_invalid_uuid_raises(self):
        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=False)
        with patch("features.auth.service.decode_jwt", return_value={"sub": "not-a-uuid", "typ": "access"}):
            with pytest.raises(AuthException):
                await get_current_user(token="tok", session=AsyncMock(), cache=mock_cache)

    @pytest.mark.asyncio
    async def test_active_user_returned(self):
        user = MagicMock()
        user.is_active = True
        mock_cache = MagicMock()
        mock_cache.exists = AsyncMock(return_value=False)

        with (
            patch("features.auth.service.decode_jwt", return_value={"sub": "00000000-0000-0000-0000-000000000001", "typ": "access"}),
            patch("features.auth.service.get_user_by_id_or_404", new_callable=AsyncMock, return_value=user),
        ):
            result = await get_current_user(token="tok", session=AsyncMock(), cache=mock_cache)
        assert result == user


class TestGetBearerToken:
    @pytest.mark.asyncio
    async def test_valid_bearer(self):
        request = MagicMock()
        request.headers = {"Authorization": "Bearer mytoken"}
        assert await _get_bearer_token(request) == "mytoken"

    @pytest.mark.asyncio
    async def test_no_header(self):
        request = MagicMock()
        request.headers = {}
        assert await _get_bearer_token(request) is None

    @pytest.mark.asyncio
    async def test_non_bearer_scheme(self):
        request = MagicMock()
        request.headers = {"Authorization": "Basic abc123"}
        assert await _get_bearer_token(request) is None

    @pytest.mark.asyncio
    async def test_bearer_empty_token(self):
        request = MagicMock()
        request.headers = {"Authorization": "Bearer "}
        assert await _get_bearer_token(request) is None


class TestIssueUserTokens:
    def test_returns_token_response(self):
        user = MagicMock()
        user.id = __import__("uuid").uuid4()
        response = MagicMock()

        with (
            patch("features.auth.service.create_access_token", return_value="access"),
            patch("features.auth.service.create_refresh_token", return_value="refresh"),
            patch("features.auth.service._set_auth_cookies"),
        ):
            from features.auth.schemas import TokenResponse
            result = issue_user_tokens(user, response)

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"


class TestRegisterUser:
    @pytest.mark.asyncio
    async def test_register_user(self):
        from features.users.schemas import UserCreate

        data = UserCreate(name="Test", phone_number="+79001234567", password="Password1")
        mock_user = MagicMock()

        with (
            patch("features.auth.service.ensure_user_not_exists_by_phone", new_callable=AsyncMock),
            patch("features.auth.service.users_crud.create_user", new_callable=AsyncMock, return_value=mock_user),
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

        with patch("features.auth.service.decode_jwt", return_value={"typ": "access", "sub": "id", "exp": 9999999999}):
            with pytest.raises(AuthException, match="token type"):
                await refresh_user_token(request, MagicMock(), AsyncMock())

    @pytest.mark.asyncio
    async def test_session_expired_raises(self):
        import time
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        with patch("features.auth.service.decode_jwt", return_value={
            "typ": "refresh", "sub": "00000000-0000-0000-0000-000000000001",
            "exp": 9999999999, "session_exp": int(time.time()) - 1000,
        }):
            with pytest.raises(AuthException, match="Session has expired"):
                await refresh_user_token(request, MagicMock(), AsyncMock())

    @pytest.mark.asyncio
    async def test_already_used_raises(self):
        import time
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        mock_cache = MagicMock()
        mock_cache.set_nx = AsyncMock(return_value=False)

        with (
            patch("features.auth.service.decode_jwt", return_value={
                "typ": "refresh", "sub": "00000000-0000-0000-0000-000000000001",
                "exp": int(time.time()) + 3600, "jti": "jti1",
            }),
            patch("features.auth.service.get_redis_cache", return_value=mock_cache),
        ):
            with pytest.raises(AuthException, match="already used"):
                await refresh_user_token(request, MagicMock(), AsyncMock(), cache=mock_cache)

    @pytest.mark.asyncio
    async def test_success(self):
        import time
        request = MagicMock()
        request.cookies = {"refresh_token": "tok"}
        request.headers = {}

        user = MagicMock()
        user.is_active = True
        mock_cache = MagicMock()
        mock_cache.set_nx = AsyncMock(return_value=True)

        with (
            patch("features.auth.service.decode_jwt", return_value={
                "typ": "refresh", "sub": "00000000-0000-0000-0000-000000000001",
                "exp": int(time.time()) + 3600, "jti": "jti1",
            }),
            patch("features.auth.service.get_user_by_id_or_404", new_callable=AsyncMock, return_value=user),
            patch("features.auth.service.create_access_token", return_value="new_access"),
            patch("features.auth.service.create_refresh_token", return_value="new_refresh"),
            patch("features.auth.service._set_auth_cookies"),
        ):
            result = await refresh_user_token(request, MagicMock(), AsyncMock(), cache=mock_cache)

        assert result.access_token == "new_access"
