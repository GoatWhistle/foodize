class BotConfigurationError(RuntimeError):
    pass


class WebhookSecretMissingError(BotConfigurationError):
    pass


class WebhookUrlMissingError(ValueError):
    pass


class RateLimitExhaustedError(RuntimeError):
    pass
