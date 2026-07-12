from http import HTTPStatus
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.telegram.dependencies import enforce_bot_rate_limit, verify_bot_secret
from settings.config.app_config import settings
from shared.exceptions.rules import AccessDeniedException, RateLimitException


class TestVerifyBotSecret:
    def test_correct_secret_passes(self) -> None:
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            assert (
                verify_bot_secret(x_telegram_bot_secret="correct-secret") is None  # type: ignore[func-returns-value]
            )

    def test_wrong_secret_denied(self) -> None:
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            with pytest.raises(AccessDeniedException):
                verify_bot_secret(x_telegram_bot_secret="wrong-secret")

    def test_missing_secret_denied(self) -> None:
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            with pytest.raises(AccessDeniedException):
                verify_bot_secret(x_telegram_bot_secret="")

    def test_empty_configured_secret_denied(self) -> None:
        with patch.object(settings.telegram, "bot_api_secret", ""):
            with pytest.raises(AccessDeniedException):
                verify_bot_secret(x_telegram_bot_secret="")


class TestEnforceBotRateLimit:
    @pytest.mark.asyncio
    async def test_within_limit_passes(self) -> None:
        cache = MagicMock()
        cache.incr_with_expire = AsyncMock(return_value=10)
        with patch("features.telegram.dependencies.get_redis_cache", return_value=cache):
            await enforce_bot_rate_limit("bot_register", 123, limit=10, ttl=3600)
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_register:123", 3600)

    @pytest.mark.asyncio
    async def test_over_limit_raises_429(self) -> None:
        cache = MagicMock()
        cache.incr_with_expire = AsyncMock(return_value=11)
        with patch("features.telegram.dependencies.get_redis_cache", return_value=cache):
            with pytest.raises(RateLimitException) as exc:
                await enforce_bot_rate_limit("bot_register", 123, limit=10, ttl=3600)
        assert exc.value.status_code == HTTPStatus.TOO_MANY_REQUESTS
