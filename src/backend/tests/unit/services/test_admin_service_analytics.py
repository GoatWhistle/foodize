from unittest.mock import AsyncMock, MagicMock, patch

from features.admin.service.analytics import get_advanced_analytics, get_finance, get_stats


class TestGetStats:
    async def test_delegates_to_crud(self) -> None:
        stats = MagicMock()
        with patch(
            "features.admin.crud.get_platform_stats", new_callable=AsyncMock, return_value=stats
        ):
            result = await get_stats(MagicMock())
            assert result is stats


class TestGetFinance:
    async def test_delegates_to_crud(self) -> None:
        analytics = MagicMock()
        with patch(
            "features.admin.crud.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=analytics,
        ):
            result = await get_finance(MagicMock())
            assert result is analytics


class TestGetAdvancedAnalytics:
    async def test_delegates_to_crud(self) -> None:
        analytics = MagicMock()
        with patch(
            "features.admin.crud.get_advanced_analytics",
            new_callable=AsyncMock,
            return_value=analytics,
        ):
            result = await get_advanced_analytics(MagicMock())
            assert result is analytics
