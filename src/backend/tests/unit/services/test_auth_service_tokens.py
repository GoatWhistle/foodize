import uuid
from unittest.mock import MagicMock, patch

from starlette.requests import Request

from features.auth.service import (
    OAuth2PasswordBearerWithCookie,
    get_bearer_token,
    issue_user_tokens,
)


def _make_request(
    headers: dict[str, str] | None = None,
    cookies: dict[str, str] | None = None,
) -> Request:
    raw_headers: list[tuple[bytes, bytes]] = []
    for key, value in (headers or {}).items():
        raw_headers.append((key.lower().encode(), value.encode()))
    if cookies:
        cookie_header = "; ".join(f"{k}={v}" for k, v in cookies.items())
        raw_headers.append((b"cookie", cookie_header.encode()))
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "query_string": b"",
        "headers": raw_headers,
    }
    return Request(scope)


class TestOAuth2PasswordBearerWithCookie:
    async def test_returns_cookie_token(self) -> None:
        scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/token", auto_error=False)
        request = _make_request(cookies={"access_token": "cookie_token"})
        result = await scheme(request)
        assert result == "cookie_token"

    async def test_returns_bearer_header_when_no_cookie(self) -> None:
        scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/token", auto_error=False)
        request = _make_request(headers={"Authorization": "Bearer header_token"})
        result = await scheme(request)
        assert result == "header_token"

    async def test_returns_none_when_no_token(self) -> None:
        scheme = OAuth2PasswordBearerWithCookie(tokenUrl="/token", auto_error=False)
        request = _make_request()
        result = await scheme(request)
        assert result is None


class TestGetBearerToken:
    async def test_valid_bearer(self) -> None:
        request = _make_request(headers={"Authorization": "Bearer mytoken"})
        assert await get_bearer_token(request) == "mytoken"

    async def test_no_header(self) -> None:
        request = _make_request()
        assert await get_bearer_token(request) is None

    async def test_non_bearer_scheme(self) -> None:
        request = _make_request(headers={"Authorization": "Basic abc123"})
        assert await get_bearer_token(request) is None

    async def test_bearer_empty_token(self) -> None:
        request = _make_request(headers={"Authorization": "Bearer "})
        assert await get_bearer_token(request) is None


class TestIssueUserTokens:
    def test_returns_token_response(self) -> None:
        user = MagicMock()
        user.id = uuid.uuid4()

        with (
            patch("features.auth.service.create_access_token", return_value="access"),
            patch("features.auth.service.create_refresh_token", return_value="refresh"),
        ):
            result = issue_user_tokens(user)

        assert result.access_token == "access"
        assert result.refresh_token == "refresh"
