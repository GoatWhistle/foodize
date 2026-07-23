import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_advisor.tools import build_advisor_executor
from infra.llm import ToolCall, ToolExecutor

from .advisor_tools_helpers import (
    AdvisorExecutorTestBase,
    make_advisor_vendor,
    make_finance_data,
)


class TestAdvisorExecutorDispatch(AdvisorExecutorTestBase):
    async def test_unknown_tool(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="nonexistent", arguments={})
        result = json.loads(await executor(call))
        assert "error" in result
        assert "Unknown tool" in result["error"]

    @pytest.mark.usefixtures("session")
    async def test_get_menu(self, vendor: MagicMock) -> None:
        menu_items = [
            {
                "restaurant": "R1",
                "name": "Бургер",
                "category": "burgers",
                "price": 250,
                "is_available": True,
            }
        ]
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.crud.get_menu_overview",
            new_callable=AsyncMock,
            return_value=menu_items,
        ):
            call = ToolCall(id="t1", name="get_menu", arguments={})
            result = json.loads(await execute(call))
        assert "items" in result
        assert result["items"][0]["name"] == "Бургер"

    @pytest.mark.usefixtures("session")
    async def test_get_reviews_summary(self, vendor: MagicMock) -> None:
        reviews = {
            "average_rating": 4.5,
            "review_count": 10,
            "distribution": {5: 8, 4: 2},
            "recent": [],
        }
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.crud.get_reviews_summary",
            new_callable=AsyncMock,
            return_value=reviews,
        ):
            call = ToolCall(id="t1", name="get_reviews_summary", arguments={})
            result = json.loads(await execute(call))
        assert result["average_rating"] == 4.5

    @pytest.mark.usefixtures("session")
    async def test_default_restaurant_id_used(self, vendor: MagicMock) -> None:
        default_rid = uuid.uuid4()
        finance = make_finance_data()
        execute = build_advisor_executor(vendor, default_restaurant_id=default_rid)
        with patch(
            "features.ai_advisor.tools.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=finance,
        ) as mock_fin:
            call = ToolCall(id="t1", name="get_sales_summary", arguments={})
            await execute(call)
            _, kwargs = mock_fin.call_args
            assert kwargs.get("restaurant_id") == default_rid

    @pytest.mark.usefixtures("session")
    async def test_explicit_restaurant_id_overrides_default(self) -> None:
        default_rid = uuid.uuid4()
        explicit_rid = uuid.uuid4()
        vendor = make_advisor_vendor(restaurant_ids=[explicit_rid])
        finance = make_finance_data()
        execute = build_advisor_executor(vendor, default_restaurant_id=default_rid)
        with patch(
            "features.ai_advisor.tools.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=finance,
        ) as mock_fin:
            call = ToolCall(
                id="t1", name="get_sales_summary", arguments={"restaurant_id": str(explicit_rid)}
            )
            await execute(call)
            _, kwargs = mock_fin.call_args
            assert kwargs.get("restaurant_id") == explicit_rid
