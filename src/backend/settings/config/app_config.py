from settings.config.base import BaseConfig
from settings.config.infra import DbConfig, RabbitMQConfig
from settings.config.infra.redis import RedisConfig
from settings.config.runtime import ApiPrefix, AuthConfig, CorsConfig, RunConfig


class AppConfig(BaseConfig):
    run: RunConfig = RunConfig()
    db: DbConfig
    api: ApiPrefix = ApiPrefix()
    auth: AuthConfig = AuthConfig()
    redis: RedisConfig = RedisConfig()
    rabbitmq: RabbitMQConfig = RabbitMQConfig()
    cors: CorsConfig = CorsConfig()


settings = AppConfig()  # type: ignore[call-arg]
