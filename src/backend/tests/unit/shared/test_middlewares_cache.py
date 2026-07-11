from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, HTTPException
from redis.exceptions import RedisError
from starlette.requests import Request
from starlette.testclient import TestClient

from middlewares.cache import _DEFAULT_CACHEABLE_PATHS, _MUTATING_METHODS, AutoCacheMiddleware


def _make_request(method="GET", path="/api/v1/restaurants", query_string=b""):
    scope = {
        "type": "http",
        "method": method,
        "path": path,
        "query_string": query_string,
        "headers": [],
    }
    return Request(scope)


class TestCacheMiddlewareConstants:
    def test_default_cacheable_paths_contain_restaurants(self):
        assert "restaurants" in _DEFAULT_CACHEABLE_PATHS

    def test_default_cacheable_paths_contain_menu(self):
        assert "menu" in _DEFAULT_CACHEABLE_PATHS

    def test_default_cacheable_paths_exclude_orders(self):
        assert "orders" not in _DEFAULT_CACHEABLE_PATHS

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


class TestCacheMiddlewareIsCacheable:
    def test_orders_path_is_not_cacheable(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_cacheable("/api/v1/orders/123") is False

    def test_cart_path_is_not_cacheable(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_cacheable("/api/v1/cart") is False

    def test_ws_path_is_not_cacheable(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_cacheable("/api/v1/ws/orders") is False

    def test_restaurants_path_is_cacheable(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_cacheable("/api/v1/restaurants") is True

    def test_menu_path_is_cacheable(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_cacheable("/api/v1/menu") is True

    def test_admin_path_is_not_cacheable(self):
        middleware = AutoCacheMiddleware(app=None)
        assert middleware._is_cacheable("/api/v1/admin/restaurants") is False

    def test_custom_cacheable_paths(self):
        middleware = AutoCacheMiddleware(app=None, cacheable_paths=["custom"])
        assert middleware._is_cacheable("/api/v1/custom/resource") is True
        assert middleware._is_cacheable("/api/v1/restaurants") is False


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

    def test_authenticated_post_invalidates_cache_tag(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache(cached_value="cache:abc")
        mock_cache.smembers = AsyncMock(return_value={"cache:abc"})

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.post("/api/v1/restaurants", headers={"Authorization": "Bearer token"})

        assert response.status_code == 200
        mock_cache.smembers.assert_awaited_once_with("tag:restaurants")
        mock_cache.delete_many.assert_awaited_once()

    def test_cookie_auth_post_invalidates_cache_tag(self):
        app = _make_cache_app()
        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app, cookies={"access_token": "abc"})
            client.post("/api/v1/restaurants")

        mock_cache.smembers.assert_awaited_once()
        mock_cache.delete_many.assert_awaited_once()

    def test_failed_mutation_does_not_invalidate(self):
        app = FastAPI()

        @app.post("/api/v1/restaurants")
        async def create_restaurant():
            raise HTTPException(status_code=400)

        mock_cache = self._mock_cache()

        with patch("middlewares.cache.get_redis_cache", return_value=mock_cache):
            app.add_middleware(AutoCacheMiddleware)
            client = TestClient(app)
            response = client.post("/api/v1/restaurants")

        assert response.status_code == 400
        mock_cache.smembers.assert_not_awaited()
        mock_cache.delete_many.assert_not_awaited()

    def test_get_redis_error_falls_through(self):
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
