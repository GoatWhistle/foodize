import pytest
from unittest.mock import AsyncMock, MagicMock

from middlewares.throttling import ThrottlingMiddleware, _extract_user_id


@pytest.mark.asyncio
async def test_allows_requests_under_limit():
    redis = AsyncMock()
    redis.incr = AsyncMock(side_effect=[1, 2, 3])
    redis.expire = AsyncMock()
    middleware = ThrottlingMiddleware(redis=redis, limit=5, window_seconds=3)

    handler = AsyncMock(return_value="ok")
    event = MagicMock(from_user=MagicMock(id=42))

    for _ in range(3):
        result = await middleware(handler, event, {})
        assert result == "ok"

    assert handler.await_count == 3
    redis.expire.assert_awaited_once_with("tg_throttle:42", 3)


@pytest.mark.asyncio
async def test_blocks_requests_over_limit():
    redis = AsyncMock()
    redis.incr = AsyncMock(side_effect=[1, 2, 3, 4, 5, 6])
    redis.expire = AsyncMock()
    middleware = ThrottlingMiddleware(redis=redis, limit=5, window_seconds=3)

    handler = AsyncMock(return_value="ok")
    event = MagicMock(from_user=MagicMock(id=42))

    results = [await middleware(handler, event, {}) for _ in range(6)]

    assert results[:5] == ["ok"] * 5
    assert results[5] is None
    assert handler.await_count == 5


@pytest.mark.asyncio
async def test_skips_throttling_when_no_user():
    redis = AsyncMock()
    middleware = ThrottlingMiddleware(redis=redis)

    handler = AsyncMock(return_value="ok")
    event = MagicMock(from_user=None)

    result = await middleware(handler, event, {})

    assert result == "ok"
    redis.incr.assert_not_called()


@pytest.mark.asyncio
async def test_tracks_distinct_users_independently():
    redis = AsyncMock()
    call_counts: dict[str, int] = {}

    async def _incr(key):
        call_counts[key] = call_counts.get(key, 0) + 1
        return call_counts[key]

    redis.incr = AsyncMock(side_effect=_incr)
    redis.expire = AsyncMock()
    middleware = ThrottlingMiddleware(redis=redis, limit=1, window_seconds=3)

    handler = AsyncMock(return_value="ok")
    user_a = MagicMock(from_user=MagicMock(id=1))
    user_b = MagicMock(from_user=MagicMock(id=2))

    assert await middleware(handler, user_a, {}) == "ok"
    assert await middleware(handler, user_b, {}) == "ok"
    assert await middleware(handler, user_a, {}) is None
    assert await middleware(handler, user_b, {}) is None


def test_extract_user_id_from_update_and_plain_event():
    from aiogram.types import Update

    update = MagicMock(spec=Update)
    update.event = MagicMock(from_user=MagicMock(id=7))
    assert _extract_user_id(update) == 7

    plain_event = MagicMock(from_user=MagicMock(id=8))
    assert _extract_user_id(plain_event) == 8

    no_user_event = MagicMock(from_user=None)
    assert _extract_user_id(no_user_event) is None
