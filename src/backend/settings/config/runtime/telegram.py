from settings.config.base import BaseConfig

_WEAK_BOT_API_SECRETS = {
    "",
    "zzzzzzzzzzzzzzzzzzzzzzz",
    "CHANGE_ME_GENERATE_RANDOM_SECRET",
    "CHANGE_ME_GENERATE_RANDOM_SECRET_DO_NOT_USE_IN_PRODUCTION_XXXXXXXXXXXXXXXX",
    "changeme",
    "secret",
}


class TelegramConfig(BaseConfig):
    bot_token: str = ""
    mini_app_url: str = ""
    bot_api_secret: str = ""
    bot_username: str = "FoodizeBot"
    # Egress proxy for api.telegram.org calls (TELEGRAM__PROXY_URL, http://user:pass@host:port).
    # Needed when the hosting network cannot reach Telegram directly; empty = direct.
    proxy_url: str = ""

    @property
    def is_weak_bot_api_secret(self) -> bool:
        return self.bot_api_secret.strip().lower() in {v.lower() for v in _WEAK_BOT_API_SECRETS}
