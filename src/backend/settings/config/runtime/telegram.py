from settings.config.base import BaseConfig


class TelegramConfig(BaseConfig):
    bot_token: str = ""
    mini_app_url: str = ""
