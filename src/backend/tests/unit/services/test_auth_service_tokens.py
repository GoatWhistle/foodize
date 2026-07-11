from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.auth.service import (
    OAuth2PasswordBearerWithCookie,
    _get_bearer_token,
    issue_user_tokens,
)


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
            result = issue_user_tokens(user, response)

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"
