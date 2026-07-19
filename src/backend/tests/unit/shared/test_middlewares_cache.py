from http import HTTPStatus
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

from fastapi import FastAPI, HTTPException
from redis.exceptions import RedisError
from starlette.testclient import TestClient

from middlewares.cache import AutoCacheMiddleware


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
