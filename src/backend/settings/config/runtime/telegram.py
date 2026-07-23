from settings.config.base import BaseConfig

_MIN_BOT_API_SECRET_LENGTH = 32
_MIN_BOT_API_SECRET_CHARSET = 3


def _charset_classes(value: str) -> int:
    has_lower = any(char.islower() for char in value)
    has_upper = any(char.isupper() for char in value)
    has_digit = any(char.isdigit() for char in value)
    has_symbol = any(not char.isalnum() for char in value)
    return sum((has_lower, has_upper, has_digit, has_symbol))


class TelegramConfig(BaseConfig):
    bot_token: str = ""
    mini_app_url: str = ""
    bot_api_secret: str = ""
    bot_username: str = "FoodizeBot"
    proxy_url: str = ""

    @property
    def is_weak_bot_api_secret(self) -> bool:
        secret = self.bot_api_secret.strip()
        if len(secret) < _MIN_BOT_API_SECRET_LENGTH:
            return True
        if len(set(secret)) < _MIN_BOT_API_SECRET_LENGTH // 2:
            return True
        return _charset_classes(secret) < _MIN_BOT_API_SECRET_CHARSET
