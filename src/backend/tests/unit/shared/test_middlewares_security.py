from http import HTTPStatus

from fastapi import FastAPI
from starlette.testclient import TestClient

from middlewares.security import SecurityHeadersMiddleware


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
