from database import db_helper
from features.ai_order_agent.crud import get_embedding_column_dim
from settings.config.app_config import settings
from shared.exceptions.internal import (
    EmbeddingDimMismatchConfigError,
    InsecureRabbitMQConfigError,
    InsecureRedisConfigError,
    InsecureS3ConfigError,
    WeakTelegramSecretConfigError,
    WildcardCorsConfigError,
)
from utils.logging_setup import get_logger

logger = get_logger(__name__)


async def verify_embedding_dim() -> None:
    try:
        async with db_helper.session_factory() as session:
            column_dim = await get_embedding_column_dim(session)
    except Exception as exc:
        logger.warning("embedding_dim_check_skipped", error=repr(exc))
        return
    if column_dim is None:
        logger.warning("embedding_dim_check_skipped reason=column_missing")
        return
    configured_dim = settings.llm.embedding_dim
    if column_dim != configured_dim:
        raise EmbeddingDimMismatchConfigError(column_dim, configured_dim)


def enforce_production_guards() -> None:
    if settings.rabbitmq.is_default_insecure and not settings.debug:
        raise InsecureRabbitMQConfigError
    if not settings.redis.password and not settings.debug:
        raise InsecureRedisConfigError
    if settings.telegram.is_weak_bot_api_secret and not settings.debug:
        raise WeakTelegramSecretConfigError
    if settings.s3.is_default_insecure and not settings.debug:
        raise InsecureS3ConfigError
    if "*" in settings.cors.allowed_origins:
        raise WildcardCorsConfigError
