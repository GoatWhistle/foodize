from http import HTTPStatus
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, HTTPException
from redis.exceptions import RedisError
from starlette.requests import Request
from starlette.testclient import TestClient

from middlewares.cache import _DEFAULT_CACHEABLE_PATHS, _MUTATING_METHODS, AutoCacheMiddleware


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


class TestCacheMiddlewareConstants:
    def test_default_cacheable_paths_contain_restaurants(self) -> None:
        assert "restaurants" in _DEFAULT_CACHEABLE_PATHS

    def test_default_cacheable_paths_contain_menu(self) -> None:
        assert "menu" in _DEFAULT_CACHEABLE_PATHS

    def test_default_cacheable_paths_exclude_orders(self) -> None:
        assert "orders" not in _DEFAULT_CACHEABLE_PATHS

    def test_mutating_methods_contains_post(self) -> None:
        assert "POST" in _MUTATING_METHODS

    def test_mutating_methods_contains_put(self) -> None:
        assert "PUT" in _MUTATING_METHODS

    def test_mutating_methods_contains_delete(self) -> None:
        assert "DELETE" in _MUTATING_METHODS

    def test_mutating_methods_contains_patch(self) -> None:
        assert "PATCH" in _MUTATING_METHODS

    def test_mutating_methods_does_not_contain_get(self) -> None:
        assert "GET" not in _MUTATING_METHODS


class TestCacheMiddlewareCacheKey:
    def test_cache_key_includes_path(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        request = _make_request(path="/api/v1/restaurants")
        key1 = middleware._make_cache_key(request)
        request2 = _make_request(path="/api/v1/menus")
        key2 = middleware._make_cache_key(request2)
        assert key1 != key2

    def test_same_path_same_query_same_key(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        r1 = _make_request(path="/api/v1/restaurants", query_string=b"page=1")
        r2 = _make_request(path="/api/v1/restaurants", query_string=b"page=1")
        assert middleware._make_cache_key(r1) == middleware._make_cache_key(r2)

    def test_different_queries_produce_different_keys(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        r1 = _make_request(path="/api/v1/restaurants", query_string=b"page=1")
        r2 = _make_request(path="/api/v1/restaurants", query_string=b"page=2")
        assert middleware._make_cache_key(r1) != middleware._make_cache_key(r2)

    def test_key_starts_with_cache_prefix(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        request = _make_request()
        key = middleware._make_cache_key(request)
        assert key.startswith("cache:")


class TestCacheMiddlewareIsCacheable:
    def test_orders_path_is_not_cacheable(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._is_cacheable("/api/v1/orders/123") is False

    def test_cart_path_is_not_cacheable(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._is_cacheable("/api/v1/cart") is False

    def test_ws_path_is_not_cacheable(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._is_cacheable("/api/v1/ws/orders") is False

    def test_restaurants_path_is_cacheable(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._is_cacheable("/api/v1/restaurants") is True

    def test_menu_path_is_cacheable(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._is_cacheable("/api/v1/menu") is True

    def test_admin_path_is_not_cacheable(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._is_cacheable("/api/v1/admin/restaurants") is False

    def test_custom_cacheable_paths(self) -> None:
        middleware = AutoCacheMiddleware(app=None, cacheable_paths=["custom"])  # type: ignore[arg-type]
        assert middleware._is_cacheable("/api/v1/custom/resource") is True
        assert middleware._is_cacheable("/api/v1/restaurants") is False


class TestCacheMiddlewareMakeTagKey:
    def test_restaurants_tag(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._make_tag_key("/api/v1/restaurants") == "tag:restaurants"

    def test_admin_restaurants_maps_to_restaurants(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._make_tag_key("/api/v1/admin/restaurants") == "tag:restaurants"

    def test_root_path(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._make_tag_key("/") == "tag:root"

    def test_admin_unknown_resource_uses_segment(self) -> None:
        middleware = AutoCacheMiddleware(app=None)  # type: ignore[arg-type]
        assert middleware._make_tag_key("/api/v1/admin/something") == "tag:something"


def _make_cache_app() -> FastAPI:
    app = FastAPI()

    @app.get("/api/v1/restaurants")
    async def list_restaurants() -> dict[str, list[Any]]:
        return {"data": []}

    @app.post("/api/v1/restaurants")
    async def create_restaurant() -> dict[str, str]:
        return {"id": "new"}

    @app.get("/api/v1/orders/1")
    async def get_order() -> dict[str, str]:
        return {"id": "1"}

    return app


class TestCacheMiddlewareDispatch:
    def _mock_cache(self, cached_value: str | None = None) -> MagicMock:
        cache = MagicMock()
        cache.get = AsyncMock(return_value=cached_value)
        cache.set = AsyncMock()
        cache.sadd = AsyncMock()
        cache.expire = AsyncMock()
        cache.sadd_with_expire = AsyncMock()
        cache.smembers = AsyncMock(return_value=set())
        cache.delete_many = AsyncMock()
        return cache

    def test_excluded_path_bypasses_cache(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/orders/1")

        assert response.status_code == HTTPStatus.OK
        mock_cache.get.assert_not_called()

    def test_authenticated_request_bypasses_cache(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/restaurants", headers={"Authorization": "Bearer token"})

        assert response.status_code == HTTPStatus.OK
        mock_cache.get.assert_not_called()

    def test_get_returns_cached_response(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache(cached_value='{"data": "cached"}')

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/restaurants")

        assert response.status_code == HTTPStatus.OK
        assert response.text == '{"data": "cached"}'

    def test_get_caches_200_response(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache(cached_value=None)

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            client.get("/api/v1/restaurants")

        mock_cache.set.assert_awaited_once()
        mock_cache.sadd_with_expire.assert_awaited_once()

    def test_post_invalidates_cache_tag(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            client.post("/api/v1/restaurants")

        mock_cache.smembers.assert_awaited_once()
        mock_cache.delete_many.assert_awaited_once()

    def test_authenticated_post_invalidates_cache_tag(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache(cached_value="cache:abc")
        mock_cache.smembers = AsyncMock(return_value={"cache:abc"})

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.post("/api/v1/restaurants", headers={"Authorization": "Bearer token"})

        assert response.status_code == HTTPStatus.OK
        mock_cache.smembers.assert_awaited_once_with("tag:restaurants")
        mock_cache.delete_many.assert_awaited_once()

    def test_cookie_auth_post_invalidates_cache_tag(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app, cookies={"access_token": "abc"})
            client.post("/api/v1/restaurants")

        mock_cache.smembers.assert_awaited_once()
        mock_cache.delete_many.assert_awaited_once()

    def test_failed_mutation_does_not_invalidate(self) -> None:
        app = FastAPI()

        @app.post("/api/v1/restaurants")
        async def create_restaurant() -> None:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST)

        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.post("/api/v1/restaurants")

        assert response.status_code == HTTPStatus.BAD_REQUEST
        mock_cache.smembers.assert_not_awaited()
        mock_cache.delete_many.assert_not_awaited()

    def test_get_redis_error_falls_through(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache()
        mock_cache.get = AsyncMock(side_effect=RedisError("connection refused"))

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.get("/api/v1/restaurants")

        assert response.status_code == HTTPStatus.OK

    def test_cookie_auth_bypasses_cache(self) -> None:
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app, cookies={"access_token": "abc"})
            response = client.get("/api/v1/restaurants")

        assert response.status_code == HTTPStatus.OK
        mock_cache.get.assert_not_called()
