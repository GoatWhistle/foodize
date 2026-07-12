from http import HTTPStatus
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import FastAPI
from starlette.requests import Request
from starlette.responses import Response
from starlette.testclient import TestClient

from middlewares.security import _SECURITY_HEADERS, SecurityHeadersMiddleware


def _make_request(
    method: str = "GET",
    path: str = "/api/v1/restaurants",
    query_string: bytes = b"",
) -> Request:
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "query_string": query_string,
        "headers": [],
    }
    return Request(scope)


class TestSecurityHeadersMiddleware:
    def test_adds_all_security_headers(self) -> None:
        app = FastAPI()

        @app.get("/test")
        async def test_route() -> dict[str, bool]:
            return {"ok": True}

        app.add_middleware(SecurityHeadersMiddleware)
        client = TestClient(app)
        response = client.get("/test")

        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert "Referrer-Policy" in response.headers
        assert "Content-Security-Policy" in response.headers

    def test_does_not_block_response(self) -> None:
        app = FastAPI()

        @app.get("/ping")
        async def ping() -> dict[str, bool]:
            return {"pong": True}

        app.add_middleware(SecurityHeadersMiddleware)
        client = TestClient(app)
        response = client.get("/ping")
        assert response.status_code == HTTPStatus.OK
        assert response.json() == {"pong": True}

    def test_security_headers_constant_has_all_expected_keys(self) -> None:
        assert "X-Content-Type-Options" in _SECURITY_HEADERS
        assert "X-Frame-Options" in _SECURITY_HEADERS
        assert "X-XSS-Protection" in _SECURITY_HEADERS
        assert "Referrer-Policy" in _SECURITY_HEADERS
        assert "Content-Security-Policy" in _SECURITY_HEADERS

    @pytest.mark.asyncio
    async def test_dispatch_calls_call_next(self) -> None:
        middleware = SecurityHeadersMiddleware(app=None)  # type: ignore[arg-type]
        mock_response = MagicMock(spec=Response)
        mock_response.headers = {}
        call_next = AsyncMock(return_value=mock_response)
        request = _make_request()
        await middleware.dispatch(request, call_next)
        call_next.assert_called_once_with(request)

    def test_x_content_type_options_is_nosniff(self) -> None:
        assert _SECURITY_HEADERS["X-Content-Type-Options"] == "nosniff"

    def test_x_frame_options_is_deny(self) -> None:
        assert _SECURITY_HEADERS["X-Frame-Options"] == "DENY"
