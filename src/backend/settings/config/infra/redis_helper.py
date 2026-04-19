import redis.asyncio as async_redis

from settings.config.app_config import settings


class RedisHelper:
    def __init__(self, url: str):
        self.pool = async_redis.ConnectionPool.from_url(url, decode_responses=True)

    def get_client(self) -> async_redis.Redis:
        return async_redis.Redis(connection_pool=self.pool)


redis_helper = RedisHelper(url=str(settings.redis.url))
