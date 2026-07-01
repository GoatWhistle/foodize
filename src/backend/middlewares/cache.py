import hashlib
import logging

from fastapi import Request, Response
from redis.exceptions import RedisError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from infra.cache.redis import get_redis_cache

logger = logging.getLogger(__name__)

_MUTATING_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

_DEFAULT_EXCLUDE_PATHS = [
    "docs",
    "openapi.json",
    "redoc",
    "api/ping",
    "api/health",
    "orders",
    "cart",
    "favorites",
    "staff",
    "users",
    "vendors/me",
    "ws",
]

_ADMIN_RESOURCE_MAP = {
    "restaurants": "restaurants",
    "vendors": "vendors",
    "users": "users",
    "reviews": "reviews",
    "menu": "menu",
    "orders": "orders",
}


class AutoCacheMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app: ASGIApp,
        ttl: int = 300,
        exclude_paths: list[str] | None = None,
    ) -> None:
        super().__init__(app)
        self.ttl = ttl
        self.exclude_paths = exclude_paths if exclude_paths is not None else _DEFAULT_EXCLUDE_PATHS

    def _make_cache_key(self, request: Request) -> str:
        query = str(sorted(request.query_params.items()))
        raw = request.url.path + query
        return "cache:" + hashlib.sha256(raw.encode()).hexdigest()

    def _make_tag_key(self, path: str) -> str:
        stripped = path.removeprefix("/api/v1/").removeprefix("/api/")
        segments = [s for s in stripped.split("/") if s]
        if not segments:
            return "tag:root"
        if segments[0] == "admin" and len(segments) > 1:
            resource = _ADMIN_RESOURCE_MAP.get(segments[1], segments[1])
            return f"tag:{resource}"
        return f"tag:{segments[0]}"

    def _is_excluded(self, path: str) -> bool:
        normalized_path = path.strip("/")
        path_segments = normalized_path.split("/")
        for excluded in self.exclude_paths:
            normalized_excluded = excluded.strip("/")
            excluded_segments = normalized_excluded.split("/")
            if path_segments[: len(excluded_segments)] == excluded_segments:
                return True
            api_v1_prefix = ["api", "v1", *excluded_segments]
            if path_segments[: len(api_v1_prefix)] == api_v1_prefix:
                return True
            api_prefix = ["api", *excluded_segments]
            if path_segments[: len(api_prefix)] == api_prefix:
                return True
        return False

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        method = request.method.upper()

        # KNOWN LIMITATION: only the "authorization" header and "access_token" cookie
        # are treated as auth signals here. Other auth schemes (e.g. custom API keys,
        # alternate session cookies) are not detected, so a personalized response
        # served under such a scheme could be cached and returned to anonymous users.
        if (
            self._is_excluded(path)
            or "authorization" in request.headers
            or request.cookies.get("access_token")
        ):
            return await call_next(request)

        cache = get_redis_cache()

        if method == "GET":
            cache_key = self._make_cache_key(request)
            try:
                cached = await cache.get(cache_key)
            except RedisError:
                return await call_next(request)

            if cached:
                return Response(content=cached, media_type="application/json")

            response = await call_next(request)

            if response.status_code == 200:
                chunks = []
                async for chunk in response.body_iterator:
                    chunks.append(chunk if isinstance(chunk, bytes) else chunk.encode())
                body = b"".join(chunks)
                try:
                    await cache.set(cache_key, body.decode(), ttl=self.ttl)
                    tag_key = self._make_tag_key(path)
                    await cache.sadd_with_expire(tag_key, cache_key, self.ttl)
                except RedisError:
                    logger.warning("Failed to write cache entry for path=%s", path, exc_info=True)
                return Response(
                    content=body,
                    status_code=response.status_code,
                    headers=dict(response.headers),
                    media_type=response.media_type,
                )

            return response

        if method in _MUTATING_METHODS:
            tag_key = self._make_tag_key(path)
            try:
                keys = await cache.smembers(tag_key)
                await cache.delete_many(*keys, tag_key)
            except RedisError:
                logger.warning("Failed to invalidate cache tag=%s", tag_key, exc_info=True)

        return await call_next(request)
