import hashlib
import json
from http import HTTPStatus
from typing import TYPE_CHECKING, cast

from fastapi import Request, Response
from redis.exceptions import RedisError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

from infra.cache.redis import get_redis_cache
from utils.logging_setup import get_logger

if TYPE_CHECKING:
    from starlette.responses import StreamingResponse

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
            status_code=envelope.get("status", HTTPStatus.OK),
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

    async def _read_cached(self, cache_key: str) -> Response | None:
        cache = get_redis_cache()
        cached = await cache.get(cache_key)
        if not cached:
            return None
        try:
            return self._build_cached_response(cached)
        except (json.JSONDecodeError, KeyError):
            return Response(content=cached, media_type="application/json")

    async def _store_and_rebuild(self, response: Response, cache_key: str, path: str) -> Response:
        chunks: list[bytes] = []
        async for chunk in cast("StreamingResponse", response).body_iterator:
            chunks.append(chunk.encode() if isinstance(chunk, str) else bytes(chunk))
        body = b"".join(chunks)
        response.headers["Vary"] = "Cookie, Authorization"
        cache = get_redis_cache()
        try:
            await cache.set(cache_key, self._serialize_response(body, response), ttl=self.ttl)
            tag_key = self._make_tag_key(path)
            await cache.sadd_with_expire(tag_key, cache_key, self.ttl)
        except UnicodeDecodeError:
            logger.warning("cache_write_skipped_binary_body", path=path)
        except RedisError:
            logger.warning("cache_write_failed", path=path, exc_info=True)
        return Response(
            content=body,
            status_code=response.status_code,
            headers=dict(response.headers),
            media_type=response.media_type,
        )

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        path = request.url.path
        method = request.method.upper()

        if method in _MUTATING_METHODS:
            response = await call_next(request)
            if HTTPStatus.OK <= response.status_code < HTTPStatus.MULTIPLE_CHOICES:
                await self._invalidate(path)
            return response

        is_personalized = (
            "authorization" in request.headers or request.cookies.get("access_token") is not None
        )
        if method != "GET" or not self._is_cacheable(path) or is_personalized:
            return await call_next(request)

        cache_key = self._make_cache_key(request)
        try:
            cached_response = await self._read_cached(cache_key)
        except RedisError:
            return await call_next(request)
        if cached_response is not None:
            return cached_response

        response = await call_next(request)
        if response.status_code != HTTPStatus.OK:
            return response
        return await self._store_and_rebuild(response, cache_key, path)
