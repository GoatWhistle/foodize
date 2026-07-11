import logging
from collections.abc import Awaitable, Callable
from typing import Any

import redis.asyncio as aioredis
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Update
from redis.exceptions import RedisError

from services import redis_client

logger = logging.getLogger(__name__)

_THROTTLE_LUA = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
"""


class ThrottlingMiddleware(BaseMiddleware):
    def __init__(self, redis: aioredis.Redis, limit: int = 5, window_seconds: int = 3) -> None:
        self._redis = redis
        self._limit = limit
        self._window_seconds = window_seconds

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user_id = _extract_user_id(event)
        if user_id is None:
            return await handler(event, data)

        key = f"tg_throttle:{user_id}"
        try:
            count = await self._redis.eval(_THROTTLE_LUA, 1, key, self._window_seconds)
        except RedisError as exc:
            logger.warning("Throttling disabled for update, Redis unavailable: %s", exc)
            return await handler(event, data)

        if count > self._limit:
            return None

        return await handler(event, data)


def _extract_user_id(event: TelegramObject) -> int | None:
    if isinstance(event, Update):
        inner = event.event
    else:
        inner = event
    user = getattr(inner, "from_user", None)
    return user.id if user is not None else None


def build_throttling_middleware(redis: aioredis.Redis | None = None) -> ThrottlingMiddleware:
    return ThrottlingMiddleware(redis=redis or redis_client.get_client())
