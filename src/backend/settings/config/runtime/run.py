from settings.config.base import BaseConfig


class RunConfig(BaseConfig):
    host: str = "0.0.0.0"
    port: int = 8000
    metrics_token: str = ""
