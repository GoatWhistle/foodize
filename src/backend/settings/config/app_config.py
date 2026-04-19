from settings.config.base import BaseConfig
from settings.config.infra import DbConfig
from settings.config.infra.redis_config import RedisConfig
from settings.config.runtime import ApiPrefix, AuthConfig, RunConfig


class AppConfig(BaseConfig):
    run: RunConfig = RunConfig()
    db: DbConfig
    api: ApiPrefix = ApiPrefix()
    auth: AuthConfig = AuthConfig()
    redis: RedisConfig = RedisConfig()


settings = AppConfig()  # type: ignore[call-arg]
