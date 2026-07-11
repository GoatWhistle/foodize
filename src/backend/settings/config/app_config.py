import logging

from pydantic import model_validator

from settings.config.base import BaseConfig
from settings.config.infra import DbConfig, RabbitMQConfig, S3Config
from settings.config.infra.redis import RedisConfig
from settings.config.runtime import (
    ApiPrefix,
    AuthConfig,
    CorsConfig,
    LLMConfig,
    LogsConfig,
    RunConfig,
    TelegramConfig,
)

logger = logging.getLogger("settings")

_LOCAL_HOSTS = ("localhost", "127.0.0.1", "::1")


class AppConfig(BaseConfig):
    run: RunConfig = RunConfig()
    db: DbConfig
    api: ApiPrefix = ApiPrefix()
    auth: AuthConfig = AuthConfig()
    redis: RedisConfig = RedisConfig()
    rabbitmq: RabbitMQConfig = RabbitMQConfig()
    cors: CorsConfig = CorsConfig()
    logs: LogsConfig = LogsConfig()
    telegram: TelegramConfig = TelegramConfig()
    llm: LLMConfig = LLMConfig()
    s3: S3Config = S3Config()
    debug: bool = False

    @model_validator(mode="after")
    def _warn_degraded_embeddings(self) -> "AppConfig":
        if (
            not self.debug
            and self.llm.embeddings_enabled
            and any(host in self.llm.embedding_base_url for host in _LOCAL_HOSTS)
        ):
            logger.warning(
                "embeddings_enabled=True but embedding_base_url=%s points to localhost — "
                "semantic search will silently fall back to keyword search in production. "
                "Set LLM__EMBEDDING_BASE_URL or LLM__EMBEDDINGS_ENABLED=false.",
                self.llm.embedding_base_url,
            )
        return self


settings = AppConfig()  # type: ignore[call-arg]
