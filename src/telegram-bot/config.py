from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from exceptions import WebhookUrlMissingError


class BotConfig(BaseSettings):
    bot_token: str = Field(alias="BOT_TOKEN")
    backend_url: str = Field(default="http://backend:8000", alias="BACKEND_URL")
    mini_app_url: str = Field(default="", alias="MINI_APP_URL")
    bot_api_secret: str = Field(default="", alias="TELEGRAM_BOT_API_SECRET")
    redis_url: str = Field(default="redis://redis:6379/0", alias="REDIS__URL")
    rabbitmq_url: str = Field(
        default="amqp://foodize:foodize@rabbitmq:5672/foodize", alias="RABBITMQ__URL"
    )
    mode: Literal["polling", "webhook"] = Field(default="polling", alias="BOT_MODE")
    webhook_url: str = Field(default="", alias="BOT_WEBHOOK_URL")
    webhook_secret: str = Field(default="", alias="BOT_WEBHOOK_SECRET")
    proxy_url: str = Field(default="", alias="BOT_PROXY_URL")

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        populate_by_name=True,
    )

    @model_validator(mode="after")
    def _validate_webhook(self) -> "BotConfig":
        if self.mode == "webhook" and not self.webhook_url:
            raise WebhookUrlMissingError("BOT_WEBHOOK_URL must be set when BOT_MODE=webhook")
        return self


bot_config = BotConfig()
