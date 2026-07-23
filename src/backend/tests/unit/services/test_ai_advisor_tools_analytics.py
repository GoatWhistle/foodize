import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_advisor.tools import build_advisor_executor
from infra.llm import ToolCall

from .advisor_tools_helpers import (
    AdvisorExecutorTestBase,
    make_advanced_data,
    make_finance_data,
)


class TestAdvisorAnalyticsTools(AdvisorExecutorTestBase):
    @pytest.mark.usefixtures("session")
    async def test_sales_summary(self, vendor: MagicMock) -> None:
        finance = make_finance_data()
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.tools.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=finance,
        ):
            call = ToolCall(id="t1", name="get_sales_summary", arguments={"period_days": 7})
            result = json.loads(await execute(call))
        assert result["total_revenue"] == 100000
        assert result["total_orders"] == 200
        assert len(result["top_items"]) == 1
        assert result["top_items"][0]["name"] == "Шаурма"

    @pytest.mark.usefixtures("session")
    async def test_peak_hours(self, vendor: MagicMock) -> None:
        advanced = make_advanced_data()
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.tools.get_advanced_analytics",
            new_callable=AsyncMock,
            return_value=advanced,
        ):
            call = ToolCall(id="t1", name="get_peak_hours", arguments={"period_days": 7})
            result = json.loads(await execute(call))
        assert "hourly_load" in result
        assert result["hourly_load"][0]["hour"] == "12"

    @pytest.mark.usefixtures("session")
    async def test_category_breakdown(self, vendor: MagicMock) -> None:
        advanced = make_advanced_data()
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.tools.get_advanced_analytics",
            new_callable=AsyncMock,
            return_value=advanced,
        ):
            call = ToolCall(id="t1", name="get_category_breakdown", arguments={})
            result = json.loads(await execute(call))
        assert "category_revenue" in result
        assert result["category_revenue"][0]["revenue"] == 50000

    @pytest.mark.usefixtures("session")
    async def test_top_and_bottom_items(self, vendor: MagicMock) -> None:
        finance = make_finance_data()
        bottom = [
            {
                "name": "Редкость",
                "category": "burgers",
                "price": 300,
                "is_available": True,
                "sold_qty": 0,
            }
        ]
        execute = build_advisor_executor(vendor)
        with (
            patch(
                "features.ai_advisor.tools.get_finance_analytics",
                new_callable=AsyncMock,
                return_value=finance,
            ),
            patch(
                "features.ai_advisor.crud.get_bottom_items",
                new_callable=AsyncMock,
                return_value=bottom,
            ),
        ):
            call = ToolCall(id="t1", name="get_top_and_bottom_items", arguments={"period_days": 30})
            result = json.loads(await execute(call))
        assert "top_items" in result
        assert "bottom_items" in result
        assert result["bottom_items"][0]["name"] == "Редкость"

    @pytest.mark.usefixtures("session")
    async def test_caching_advanced(self, vendor: MagicMock) -> None:
        advanced = make_advanced_data()
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.tools.get_advanced_analytics",
            new_callable=AsyncMock,
            return_value=advanced,
        ) as mock_adv:
            call = ToolCall(id="t1", name="get_peak_hours", arguments={"period_days": 7})
            await execute(call)
            await execute(call)
            mock_adv.assert_awaited_once()

    @pytest.mark.usefixtures("session")
    async def test_caching_finance(self, vendor: MagicMock) -> None:
        finance = make_finance_data()
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.tools.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=finance,
        ) as mock_fin:
            call = ToolCall(id="t1", name="get_sales_summary", arguments={"period_days": 7})
            await execute(call)
            await execute(call)
            mock_fin.assert_awaited_once()
