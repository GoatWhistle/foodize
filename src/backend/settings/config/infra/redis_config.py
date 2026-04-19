from pydantic import RedisDsn

from settings.config.base import BaseConfig


class RedisConfig(BaseConfig):
    url: RedisDsn | str = "redis://redis:6379/0"
