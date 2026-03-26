from settings.config.base import BaseConfig
from settings.config.infra import DbConfig
from settings.config.runtime import RunConfig, ApiPrefix, AuthConfig


class AppConfig(BaseConfig):
    run: RunConfig = RunConfig()
    db: DbConfig
    api: ApiPrefix = ApiPrefix()
    auth: AuthConfig = AuthConfig()


settings = AppConfig()
