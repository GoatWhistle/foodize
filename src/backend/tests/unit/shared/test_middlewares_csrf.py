from http import HTTPStatus

from fastapi import FastAPI
from starlette.testclient import TestClient

from middlewares.csrf import CsrfMiddleware
from settings.config.app_config import settings


def _make_app() -> FastAPI:
    app = FastAPI()

    @app.post("/api/v1/orders")
    async def create_order() -> dict[str, bool]:
        return {"ok": True}

    @app.get("/api/v1/orders")
    async def list_orders() -> dict[str, bool]:
        return {"ok": True}

    @app.post("/api/v1/telegram/bot/webhook")
    async def bot_webhook() -> dict[str, bool]:
        return {"ok": True}

    app.add_middleware(CsrfMiddleware)
    return app


class TestCsrfMiddleware:
    def test_safe_method_passes(self) -> None:
        client = TestClient(_make_app())
        response = client.get("/api/v1/orders")
        assert response.status_code == HTTPStatus.OK

    def test_bearer_auth_bypasses_csrf(self) -> None:
        client = TestClient(_make_app())
        response = client.post(
            "/api/v1/orders",
            headers={"Authorization": "Bearer token"},
        )
        assert response.status_code == HTTPStatus.OK

    def test_no_cookie_auth_passes(self) -> None:
        client = TestClient(_make_app())
        response = client.post("/api/v1/orders")
        assert response.status_code == HTTPStatus.OK

    def test_cookie_auth_without_csrf_header_is_forbidden(self) -> None:
        client = TestClient(_make_app())
        client.cookies.set("access_token", "abc")
        client.cookies.set(settings.auth.csrf_cookie_name, "csrf-value")
        response = client.post("/api/v1/orders")
        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_cookie_auth_with_matching_csrf_passes(self) -> None:
        client = TestClient(_make_app())
        client.cookies.set("access_token", "abc")
        client.cookies.set(settings.auth.csrf_cookie_name, "csrf-value")
        response = client.post(
            "/api/v1/orders",
            headers={settings.auth.csrf_header_name: "csrf-value"},
        )
        assert response.status_code == HTTPStatus.OK

    def test_cookie_auth_with_mismatched_csrf_is_forbidden(self) -> None:
        client = TestClient(_make_app())
        client.cookies.set("access_token", "abc")
        client.cookies.set(settings.auth.csrf_cookie_name, "csrf-value")
        response = client.post(
            "/api/v1/orders",
            headers={settings.auth.csrf_header_name: "other-value"},
        )
        assert response.status_code == HTTPStatus.FORBIDDEN

    def test_telegram_bot_path_is_exempt(self) -> None:
        client = TestClient(_make_app())
        client.cookies.set("access_token", "abc")
        response = client.post("/api/v1/telegram/bot/webhook")
        assert response.status_code == HTTPStatus.OK
