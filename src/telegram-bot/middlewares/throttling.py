from collections.abc import Awaitable, Callable
from typing import Any

import redis.asyncio as aioredis
from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, Update

from config import bot_config


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
        count = await self._redis.incr(key)
        if count == 1:
            await self._redis.expire(key, self._window_seconds)
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


def build_throttling_middleware() -> ThrottlingMiddleware:
    redis = aioredis.from_url(bot_config.redis_url, decode_responses=True)
    return ThrottlingMiddleware(redis=redis)
