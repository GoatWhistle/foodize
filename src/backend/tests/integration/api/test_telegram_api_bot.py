import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from settings.config.app_config import settings


class _FakeUser:
    def __init__(self):
        self.id = uuid.uuid4()
        self.name = "Test User"
        self.phone_number = "79001234567"
        self.email = None
        self.telegram_username = "test_tg"
        self.telegram_id = None
        self.permissions = []
        self.has_password = False
        self.first_name = None
        self.last_name = None
        self.middle_name = None
        self.is_active = True
        self.created_at = None


def _make_user_read():
    return _FakeUser()


def _make_cache(count: int = 1):
    cache = MagicMock()
    cache.incr_with_expire = AsyncMock(return_value=count)
    return cache


class TestTelegramBotSecret:
    @pytest.mark.asyncio
    async def test_bot_register_wrong_secret(self, client: AsyncClient):
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
                headers={"X-Telegram-Bot-Secret": "wrong-secret"},
            )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_bot_register_missing_secret(self, client: AsyncClient):
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
            )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_bot_register_empty_configured_secret_denied(self, client: AsyncClient):
        with patch.object(settings.telegram, "bot_api_secret", ""):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
                headers={"X-Telegram-Bot-Secret": ""},
            )
        assert response.status_code == 403


class TestTelegramBotRegister:
    @pytest.mark.asyncio
    async def test_bot_register_success(self, client: AsyncClient):
        user = _make_user_read()
        cache = _make_cache(count=1)
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
        assert response.status_code == 200
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_register:123", 3600)

    @pytest.mark.asyncio
    async def test_bot_register_rate_limited(self, client: AsyncClient):
        cache = _make_cache(count=11)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/register",
                json={"telegram_id": 123, "name": "Bot User"},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == 429


class TestTelegramBotLinkPhone:
    @pytest.mark.asyncio
    async def test_bot_link_phone_success(self, client: AsyncClient):
        user = _make_user_read()
        cache = _make_cache(count=1)
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
        assert response.status_code == 200
        cache.incr_with_expire.assert_awaited_once_with("rl:link_phone:55", 3600)

    @pytest.mark.asyncio
    async def test_bot_link_phone_rate_limited(self, client: AsyncClient):
        cache = _make_cache(count=6)
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
        assert response.status_code == 429


class TestTelegramBotVendorStatus:
    @pytest.mark.asyncio
    async def test_bot_vendor_status_success(self, client: AsyncClient):
        cache = _make_cache(count=1)
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
        assert response.status_code == 200
        assert response.json()["data"]["is_vendor"] is False
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_vendor_status:77", 60)

    @pytest.mark.asyncio
    async def test_bot_vendor_status_rate_limited(self, client: AsyncClient):
        cache = _make_cache(count=21)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/vendor-status",
                json={"telegram_id": 77},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == 429


class TestTelegramBotTelegramId:
    @pytest.mark.asyncio
    async def test_bot_telegram_id_success(self, client: AsyncClient):
        cache = _make_cache(count=1)
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
        assert response.status_code == 200
        assert response.json()["data"]["telegram_id"] == 555
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_telegram_id:user-abc", 60)

    @pytest.mark.asyncio
    async def test_bot_telegram_id_not_found_returns_null(self, client: AsyncClient):
        cache = _make_cache(count=1)
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
        assert response.status_code == 200
        assert response.json()["data"]["telegram_id"] is None

    @pytest.mark.asyncio
    async def test_bot_telegram_id_wrong_secret(self, client: AsyncClient):
        with patch.object(settings.telegram, "bot_api_secret", "correct-secret"):
            response = await client.post(
                "/api/v1/telegram/bot/telegram-id",
                json={"user_id": "user-abc"},
                headers={"X-Telegram-Bot-Secret": "wrong-secret"},
            )
        assert response.status_code == 403


class TestTelegramBotOrders:
    @pytest.mark.asyncio
    async def test_bot_orders_success(self, client: AsyncClient):
        cache = _make_cache(count=1)
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
        assert response.status_code == 200
        assert response.json()["data"] == []
        cache.incr_with_expire.assert_awaited_once_with("rl:bot_orders:88", 60)

    @pytest.mark.asyncio
    async def test_bot_orders_rate_limited(self, client: AsyncClient):
        cache = _make_cache(count=21)
        with (
            patch.object(settings.telegram, "bot_api_secret", "correct-secret"),
            patch("features.telegram.dependencies.get_redis_cache", return_value=cache),
        ):
            response = await client.post(
                "/api/v1/telegram/bot/orders",
                json={"telegram_id": 88},
                headers={"X-Telegram-Bot-Secret": "correct-secret"},
            )
        assert response.status_code == 429
