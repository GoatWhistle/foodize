import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from starlette.requests import Request
from starlette.responses import Response
from starlette.testclient import TestClient
from fastapi import FastAPI

from middlewares.security import SecurityHeadersMiddleware, _SECURITY_HEADERS
from middlewares.request_id import RequestIDMiddleware
from middlewares.cache import AutoCacheMiddleware, _MUTATING_METHODS, _DEFAULT_EXCLUDE_PATHS


def _make_request(method="GET", path="/api/v1/restaurants", query_string=b""):
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "query_string": query_string,
        "headers": [],
    }
    return Request(scope)


class TestSecurityHeadersMiddleware:
    def test_adds_all_security_headers(self):
        app = FastAPI()

        @app.get("/test")
        async def test_route():
            return {"ok": True}

        app.add_middleware(SecurityHeadersMiddleware)
        client = TestClient(app)
        response = client.get("/test")

        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert "Referrer-Policy" in response.headers
        assert "Content-Security-Policy" in response.headers

    def test_does_not_block_response(self):
        app = FastAPI()

        @app.get("/ping")
        async def ping():
            return {"pong": True}

        app.add_middleware(SecurityHeadersMiddleware)
        client = TestClient(app)
        response = client.get("/ping")
        assert response.status_code == 200
        assert response.json() == {"pong": True}

    def test_security_headers_constant_has_all_expected_keys(self):
        assert "X-Content-Type-Options" in _SECURITY_HEADERS
        assert "X-Frame-Options" in _SECURITY_HEADERS
        assert "X-XSS-Protection" in _SECURITY_HEADERS
        assert "Referrer-Policy" in _SECURITY_HEADERS
        assert "Content-Security-Policy" in _SECURITY_HEADERS

    @pytest.mark.asyncio
    async def test_dispatch_calls_call_next(self):
        middleware = SecurityHeadersMiddleware(app=None)
        mock_response = MagicMock(spec=Response)
        mock_response.headers = {}
        call_next = AsyncMock(return_value=mock_response)
        request = _make_request()
        await middleware.dispatch(request, call_next)
        call_next.assert_called_once_with(request)

    def test_x_content_type_options_is_nosniff(self):
        assert _SECURITY_HEADERS["X-Content-Type-Options"] == "nosniff"

    def test_x_frame_options_is_deny(self):
        assert _SECURITY_HEADERS["X-Frame-Options"] == "DENY"


class TestRequestIDMiddleware:
    def test_adds_x_request_id_header(self):
        app = FastAPI()

        @app.get("/test")
        async def test_route():
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/test")
        assert "X-Request-ID" in response.headers
        header_val = response.headers["X-Request-ID"]
        assert len(header_val) == 36

    def test_request_id_is_valid_uuid(self):
        app = FastAPI()

        @app.get("/uuid-test")
        async def test_route():
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/uuid-test")
        request_id = response.headers.get("X-Request-ID", "")
        parsed = uuid.UUID(request_id)
        assert str(parsed) == request_id

    def test_each_request_gets_unique_id(self):
        app = FastAPI()

        @app.get("/unique")
        async def test_route():
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        r1 = client.get("/unique")
        r2 = client.get("/unique")
        assert r1.headers["X-Request-ID"] != r2.headers["X-Request-ID"]

    def test_sets_request_state_request_id(self):
        captured = {}

        app = FastAPI()

        @app.get("/state-test")
        async def test_route(request: Request):
            captured["id"] = request.state.request_id
            return {"ok": True}

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app)
        response = client.get("/state-test")
        assert captured.get("id") is not None
        assert captured["id"] == response.headers["X-Request-ID"]


class TestCacheMiddlewareConstants:
    def test_default_exclude_paths_contain_orders(self):
        assert "orders" in _DEFAULT_EXCLUDE_PATHS

    def test_default_exclude_paths_contain_cart(self):
        assert "cart" in _DEFAULT_EXCLUDE_PATHS

    def test_default_exclude_paths_contain_ws(self):
        assert "ws" in _DEFAULT_EXCLUDE_PATHS

    def test_mutating_methods_contains_post(self):
        assert "POST" in _MUTATING_METHODS

    def test_mutating_methods_contains_put(self):
        assert "PUT" in _MUTATING_METHODS

    def test_mutating_methods_contains_delete(self):
        assert "DELETE" in _MUTATING_METHODS

    def test_mutating_methods_contains_patch(self):
        assert "PATCH" in _MUTATING_METHODS

    def test_mutating_methods_does_not_contain_get(self):
        assert "GET" not in _MUTATING_METHODS


class TestCacheMiddlewareCacheKey:
    def test_cache_key_includes_path(self):
        middleware = AutoCacheMiddleware(app=None)
        request = _make_request(path="/api/v1/restaurants")
        key1 = middleware._make_cache_key(request)
        request2 = _make_request(path="/api/v1/menus")
        key2 = middleware._make_cache_key(request2)
        assert key1 != key2

    def test_same_path_same_query_same_key(self):
        middleware = AutoCacheMiddleware(app=None)
        r1 = _make_request(path="/api/v1/restaurants", query_string=b"page=1")
        r2 = _make_request(path="/api/v1/restaurants", query_string=b"page=1")
        assert middleware._make_cache_key(r1) == middleware._make_cache_key(r2)

    def test_different_queries_produce_different_keys(self):
        middleware = AutoCacheMiddleware(app=None)
        r1 = _make_request(path="/api/v1/restaurants", query_string=b"page=1")
        r2 = _make_request(path="/api/v1/restaurants", query_string=b"page=2")
        assert middleware._make_cache_key(r1) != middleware._make_cache_key(r2)

    def test_key_starts_with_cache_prefix(self):
        middleware = AutoCacheMiddleware(app=None)
        request = _make_request()
        key = middleware._make_cache_key(request)
        assert key.startswith("cache:")


class TestCacheMiddlewareIsExcluded:
    def test_orders_path_is_excluded(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_excluded("/api/v1/orders/123") is True

    def test_cart_path_is_excluded(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_excluded("/api/v1/cart") is True

    def test_ws_path_is_excluded(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_excluded("/api/v1/ws/orders") is True

    def test_restaurants_path_is_not_excluded(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_excluded("/api/v1/restaurants") is False

    def test_menu_path_is_not_excluded(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_excluded("/api/v1/menu") is False

    def test_custom_exclude_paths(self):
        middleware = AutoCacheMiddleware(app=None, exclude_paths=["custom"])
        assert middleware._is_excluded("/api/v1/custom/resource") is True
        assert middleware._is_excluded("/api/v1/restaurants") is False


class TestCacheMiddlewareMakeTagKey:
    def test_restaurants_tag(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._make_tag_key("/api/v1/restaurants") == "tag:restaurants"

    def test_admin_restaurants_maps_to_restaurants(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._make_tag_key("/api/v1/admin/restaurants") == "tag:restaurants"

    def test_root_path(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._make_tag_key("/") == "tag:root"

    def test_admin_unknown_resource_uses_segment(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._make_tag_key("/api/v1/admin/something") == "tag:something"


def _make_cache_app():
    app = FastAPI()

    @app.get("/api/v1/restaurants")
    async def list_restaurants():
        return {"data": []}

    @app.post("/api/v1/restaurants")
    async def create_restaurant():
        return {"id": "new"}

    @app.get("/api/v1/orders/1")
    async def get_order():
        return {"id": "1"}

    return app


class TestCacheMiddlewareDispatch:
    def _mock_cache(self, cached_value=None):
        cache = MagicMock()
        cache.get = AsyncMock(return_value=cached_value)
        cache.set = AsyncMock()
        cache.sadd = AsyncMock()
        cache.expire = AsyncMock()
        cache.sadd_with_expire = AsyncMock()
        cache.smembers = AsyncMock(return_value=set())
        cache.delete_many = AsyncMock()
        return cache

    def test_excluded_path_bypasses_cache(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/orders/1")

        assert response.status_code == 200
        mock_cache.get.assert_not_called()

    def test_authenticated_request_bypasses_cache(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/restaurants", headers={"Authorization": "Bearer token"})

        assert response.status_code == 200
        mock_cache.get.assert_not_called()

    def test_get_returns_cached_response(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache(cached_value='{"data": "cached"}')

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/restaurants")

        assert response.status_code == 200
        assert response.text == '{"data": "cached"}'

    def test_get_caches_200_response(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache(cached_value=None)

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            client.get("/api/v1/restaurants")

        mock_cache.set.assert_awaited_once()
        mock_cache.sadd_with_expire.assert_awaited_once()

    def test_post_invalidates_cache_tag(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            client.post("/api/v1/restaurants")

        mock_cache.smembers.assert_awaited_once()
        mock_cache.delete_many.assert_awaited_once()

    def test_get_redis_error_falls_through(self):
        from redis.exceptions import RedisError

        app = _make_cache_app()
        mock_cache = self._mock_cache()
        mock_cache.get = AsyncMock(side_effect=RedisError("connection refused"))

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/restaurants")

        assert response.status_code == 200

    def test_cookie_auth_bypasses_cache(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app, cookies={"access_token": "abc"})
            response = client.get("/api/v1/restaurants")

        assert response.status_code == 200
        mock_cache.get.assert_not_called()


class TestRequestIDMiddlewareDispatchError:
    def test_logs_and_reraises_exception(self):
        app = FastAPI()

        @app.get("/error")
        async def boom():
            raise ValueError("test error")

        app.add_middleware(RequestIDMiddleware)
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/error")
        assert response.status_code == 500
