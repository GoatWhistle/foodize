import logging
import secrets
from http import HTTPStatus

from fastapi import Header, HTTPException

from infra.cache.redis import get_redis_cache
from settings.config.app_config import settings
from shared.exceptions import AccessDeniedException

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
    telegram_id: int,
    limit: int,
    ttl: int,
) -> None:
    key = f"rl:{name}:{telegram_id}"
    reqs = await get_redis_cache().incr_with_expire(key, ttl)
    if reqs > limit:
        logger.warning("telegram %s rate limit exceeded: telegram_id=%s", name, telegram_id)
        raise HTTPException(status_code=HTTPStatus.TOO_MANY_REQUESTS, detail="Rate limit exceeded")
