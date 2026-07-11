import hashlib
import json

from fastapi import Request, Response
from redis.exceptions import RedisError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from infra.cache.redis import get_redis_cache
from utils.logging_setup import get_logger

logger = get_logger(__name__)

_MUTATING_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

_EXCLUDED_CACHE_HEADERS = {"content-length", "content-encoding", "transfer-encoding"}

_DEFAULT_CACHEABLE_PATHS = [
    "restaurants",
    "menu",
    "reviews",
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
        cacheable_paths: list[str] | None = None,
    ) -> None:
        super().__init__(app)
        self.ttl = ttl
        self.cacheable_paths = (
            cacheable_paths if cacheable_paths is not None else _DEFAULT_CACHEABLE_PATHS
        )

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

    def _is_cacheable(self, path: str) -> bool:
        stripped = path.removeprefix("/api/v1/").removeprefix("/api/")
        segments = [s for s in stripped.split("/") if s]
        if not segments:
            return False
        if segments[0] == "admin":
            return False
        return segments[0] in self.cacheable_paths

    @staticmethod
    def _serialize_response(body: bytes, response: Response) -> str:
        headers = {
            key: value
            for key, value in response.headers.items()
            if key.lower() not in _EXCLUDED_CACHE_HEADERS
        }
        return json.dumps(
            {
                "body": body.decode(),
                "status": response.status_code,
                "media_type": response.media_type,
                "headers": headers,
            }
        )

    @staticmethod
    def _build_cached_response(raw: str) -> Response:
        envelope = json.loads(raw)
        return Response(
            content=envelope["body"],
            status_code=envelope.get("status", 200),
            headers=envelope.get("headers"),
            media_type=envelope.get("media_type") or "application/json",
        )

    async def _invalidate(self, path: str) -> None:
        cache = get_redis_cache()
        tag_key = self._make_tag_key(path)
        try:
            keys = await cache.smembers(tag_key)
            await cache.delete_many(*keys, tag_key)
        except RedisError:
            logger.warning("cache_invalidate_failed", tag=tag_key, exc_info=True)

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path
        method = request.method.upper()

        if method in _MUTATING_METHODS:
            response = await call_next(request)
            if 200 <= response.status_code < 300:
                await self._invalidate(path)
            return response

        is_personalized = (
            "authorization" in request.headers or request.cookies.get("access_token") is not None
        )
        if method != "GET" or not self._is_cacheable(path) or is_personalized:
            return await call_next(request)

        cache = get_redis_cache()
        cache_key = self._make_cache_key(request)
        try:
            cached = await cache.get(cache_key)
        except RedisError:
            return await call_next(request)

        if cached:
            try:
                return self._build_cached_response(cached)
            except (json.JSONDecodeError, KeyError):
                return Response(content=cached, media_type="application/json")

        response = await call_next(request)

        if response.status_code == 200:
            chunks = []
            async for chunk in response.body_iterator:
                chunks.append(chunk if isinstance(chunk, bytes) else chunk.encode())
            body = b"".join(chunks)
            response.headers["Vary"] = "Cookie, Authorization"
            try:
                await cache.set(cache_key, self._serialize_response(body, response), ttl=self.ttl)
                tag_key = self._make_tag_key(path)
                await cache.sadd_with_expire(tag_key, cache_key, self.ttl)
            except UnicodeDecodeError:
                pass
            except RedisError:
                logger.warning("cache_write_failed", path=path, exc_info=True)
            return Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        return response
