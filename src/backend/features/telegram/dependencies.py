import logging
import secrets

from fastapi import Header

from infra.cache.redis import get_redis_cache
from settings.config.app_config import settings
from shared.exceptions import AccessDeniedException, RateLimitException

logger = logging.getLogger(__name__)


def verify_bot_secret(
    x_telegram_bot_secret: str = Header("", alias="X-Telegram-Bot-Secret"),
) -> None:
    if not settings.telegram.bot_api_secret or not secrets.compare_digest(
        settings.telegram.bot_api_secret, x_telegram_bot_secret
    ):
        raise AccessDeniedException(detail="Invalid bot secret")


async def enforce_bot_rate_limit(
    name: str,
    identifier: int | str,
    limit: int,
    ttl: int,
) -> None:
    key = f"rl:{name}:{identifier}"
    reqs = await get_redis_cache().incr_with_expire(key, ttl)
    if reqs > limit:
        logger.warning("telegram %s rate limit exceeded: identifier=%s", name, identifier)
        raise RateLimitException()
