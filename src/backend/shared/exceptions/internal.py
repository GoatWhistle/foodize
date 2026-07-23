class InternalError(Exception):
    detail: str = "Internal error"

    def __init__(self, detail: str | None = None) -> None:
        self.detail = detail if detail is not None else type(self).detail
        super().__init__(self.detail)


class ConfigurationError(InternalError):
    detail: str = "Application is misconfigured"


class InsecureRabbitMQConfigError(ConfigurationError):
    detail: str = (
        "RABBITMQ__URL must be set to a non-default value in production. "
        "Current value uses insecure default credentials."
    )


class InsecureRedisConfigError(ConfigurationError):
    detail: str = (
        "REDIS__PASSWORD must be set to a non-empty value in production. "
        "Current value is empty, which allows unauthenticated Redis access."
    )


class WeakTelegramSecretConfigError(ConfigurationError):
    detail: str = (
        "TELEGRAM__BOT_API_SECRET must be set to a strong random value in production. "
        "Current value is empty or a known weak placeholder."
    )


class InsecureS3ConfigError(ConfigurationError):
    detail: str = (
        "S3__ACCESS_KEY / S3__SECRET_KEY must be set to non-default values in production. "
        "Current value uses insecure default 'minioadmin' credentials."
    )


class WildcardCorsConfigError(ConfigurationError):
    detail: str = (
        "CORS__ALLOWED_ORIGINS must not contain a wildcard '*' because the app is "
        "configured with allow_credentials=True. Browsers reject this combination, "
        "so a wildcard origin silently breaks all cross-origin requests. "
        "List explicit allowed origins instead."
    )


class EmbeddingDimMismatchConfigError(ConfigurationError):
    detail: str = (
        "LLM__EMBEDDING_DIM mismatch between the database column and settings. "
        "Run the matching migration or align the config before starting."
    )

    def __init__(self, column_dim: int, configured_dim: int) -> None:
        super().__init__(
            "LLM__EMBEDDING_DIM mismatch: menu_item_embeddings.embedding column has "
            f"dim={column_dim} but settings.llm.embedding_dim={configured_dim}. "
            "Run the matching migration or align the config before starting."
        )


class InvariantError(InternalError):
    detail: str = "Internal invariant violated"


class BrokerNotConnectedError(InvariantError):
    detail: str = "RabbitMQ broker is not connected. Call connect() first."


class PersistedEntityMissingError(InvariantError):
    detail: str = "Persisted entity could not be reloaded after write"

    def __init__(self, entity: str) -> None:
        super().__init__(f"{entity} could not be reloaded after write")


class EmptyLLMResponseError(InvariantError):
    detail: str = "LLM returned an empty response"

    def __init__(self, model: str) -> None:
        super().__init__(f"LLM returned empty choices (model={model})")


class UnexpectedTypeError(InvariantError):
    detail: str = "Unexpected value type"

    def __init__(self, expected: str, value: object) -> None:
        super().__init__(f"expected {expected}, got {type(value).__name__}")
