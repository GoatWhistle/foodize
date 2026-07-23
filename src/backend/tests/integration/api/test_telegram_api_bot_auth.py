from http import HTTPStatus
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

from settings.config.app_config import settings

from .telegram_bot_helpers import FakeBotUser, make_bot_cache


class TestTelegramBotSecret:
    async def test_bot_register_wrong_secret(self, client: AsyncClient) -> None:
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
                headers={"X-Telegram-Bot-Secret": "wrong-secret"},
            )
        assert response.status_code == HTTPStatus.FORBIDDEN

    async def test_bot_register_missing_secret(self, client: AsyncClient) -> None:
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
            )
        assert response.status_code == HTTPStatus.FORBIDDEN

    async def test_bot_register_empty_configured_secret_denied(self, client: AsyncClient) -> None:
        with patch.object(settings.telegram, "bot_api_secret", ""):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
                headers={"X-Telegram-Bot-Secret": ""},
            )
        assert response.status_code == HTTPStatus.FORBIDDEN


class TestTelegramBotRegister:
    async def test_bot_register_success(self, client: AsyncClient) -> None:
        user = FakeBotUser()
        cache = make_bot_cache(count=1)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
            patch(
                "features.telegram.api.bot.bot_api.register_from_bot",
                new_callable=AsyncMock,
                return_value=user,
            ),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.OK
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_register:123", 3600)

    async def test_bot_register_rate_limited(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=11)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS


class TestTelegramBotLinkPhone:
    async def test_bot_link_phone_success(self, client: AsyncClient) -> None:
        user = FakeBotUser()
        cache = make_bot_cache(count=1)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
            patch(
                "features.telegram.api.bot.bot_api.link_phone_from_bot",
                new_callable=AsyncMock,
                return_value=user,
            ),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/link-phone",
                json={
                    "telegram_id": 55,
                    "phone_number": "79001234567",
                    "name": "Bot User",
                },
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.OK
        cache.incr_with_expire.assert_awaited_once_with("rl:link_phone:55", 3600)

    async def test_bot_link_phone_rate_limited(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=6)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/link-phone",
                json={
                    "telegram_id": 55,
                    "phone_number": "79001234567",
                    "name": "Bot User",
                },
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS
