from http import HTTPStatus
from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

from settings.config.app_config import settings

from .telegram_bot_helpers import make_bot_cache


class TestTelegramBotVendorStatus:
    async def test_bot_vendor_status_success(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=1)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
            patch(
                "features.telegram.api.bot.bot_api.get_vendor_status_for_telegram_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/vendor-status",
                json={"telegram_id": 77},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["is_vendor"] is False
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_vendor_status:77", 60)

    async def test_bot_vendor_status_rate_limited(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=21)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/vendor-status",
                json={"telegram_id": 77},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS


class TestTelegramBotTelegramId:
    async def test_bot_telegram_id_success(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=1)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
            patch(
                "features.telegram.api.bot.bot_api.get_telegram_id_for_user_id",
                new_callable=AsyncMock,
                return_value=555,
            ),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/telegram-id",
                json={"user_id": "user-abc"},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["telegram_id"] == 555
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_telegram_id:user-abc", 60)

    async def test_bot_telegram_id_not_found_returns_null(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=1)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
            patch(
                "features.telegram.api.bot.bot_api.get_telegram_id_for_user_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/telegram-id",
                json={"user_id": "missing"},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"]["telegram_id"] is None

    async def test_bot_telegram_id_wrong_secret(self, client: AsyncClient) -> None:
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            response = await client.post(
                "/api/v1/telegram/bot/telegram-id",
                json={"user_id": "user-abc"},
                headers={"X-Telegram-Bot-Secret": "wrong-secret"},
            )
        assert response.status_code == HTTPStatus.FORBIDDEN


class TestTelegramBotOrders:
    async def test_bot_orders_success(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=1)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
            patch(
                "features.telegram.api.bot.bot_api.get_active_orders_for_telegram_id",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/orders",
                json={"telegram_id": 88},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.OK
        assert response.json()["data"] == []
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_orders:88", 60)

    async def test_bot_orders_rate_limited(self, client: AsyncClient) -> None:
        cache = make_bot_cache(count=21)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/orders",
                json={"telegram_id": 88},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS
