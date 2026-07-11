import redis.asyncio as aioredis

from config import bot_config

_client: aioredis.Redis | None = None


def init_client() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(bot_config.redis_url, decode_responses=True)
    return _client


def get_client() -> aioredis.Redis:
    if _client is None:
        return init_client()
    return _client


async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
    _client = None
