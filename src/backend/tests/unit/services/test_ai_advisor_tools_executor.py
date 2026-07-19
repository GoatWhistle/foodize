import json
import uuid
from collections.abc import Iterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_advisor.tools import build_advisor_executor
from infra.llm import ToolCall, ToolExecutor


def _make_vendor(restaurant_ids: list[uuid.UUID] | None = None) -> MagicMock:
    vendor = MagicMock()
    vendor.id = uuid.uuid4()
    restaurants = []
    for rid in restaurant_ids or []:
        restaurant = MagicMock()
        restaurant.id = rid
        restaurants.append(restaurant)
    vendor.restaurants = restaurants
    return vendor


def _make_finance_data() -> MagicMock:
    data = MagicMock()
    data.total_revenue = 100000
    data.average_check = 500
    data.total_orders = 200
    data.completed_orders = 180
    data.cancelled_orders = 20
    data.conversion_percent = 90.0
    data.revenue_growth_pct = 5.0

    top_item = MagicMock()
    top_item.name = "Шаурма"
    top_item.quantity = 50
    top_item.revenue = 25000
    data.top_items = [top_item]

    top_rest = MagicMock()
    top_rest.name = "Ресторан 1"
    top_rest.revenue = 100000
    top_rest.orders_count = 180
    data.top_restaurants = [top_rest]

    return data


def _make_advanced_data() -> MagicMock:
    data = MagicMock()

    hourly = MagicMock()
    hourly.label = "12"
    hourly.value = 15
    data.hourly_load = [hourly]

    cat = MagicMock()
    cat.label = "burgers"
    cat.value = 50000
    data.category_revenue = [cat]

    return data


class TestBuildAdvisorExecutor:
    @pytest.fixture
    def session(self) -> AsyncMock:
        return AsyncMock()

    @pytest.fixture(autouse=True)
    def _mock_session_factory(self, session: AsyncMock) -> Iterator[MagicMock]:
        mock_cm = AsyncMock()
        mock_cm.__aenter__ = AsyncMock(return_value=session)
        mock_cm.__aexit__ = AsyncMock(return_value=False)
        with patch("features.ai_advisor.tools.db_helper") as mock_db:
            mock_db.session_factory.return_value = mock_cm
            yield mock_db

    @pytest.fixture
    def vendor(self) -> MagicMock:
        return _make_vendor()

    @pytest.fixture
    def executor(self, vendor: MagicMock) -> ToolExecutor:
        return build_advisor_executor(vendor)

    async def test_unknown_tool(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="nonexistent", arguments={})
        result = json.loads(await executor(call))
        assert "error" in result
        assert "Unknown tool" in result["error"]

    async def test_sales_summary(self, session: AsyncMock, vendor: MagicMock) -> None:
        finance = _make_finance_data()
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

    async def test_peak_hours(self, session: AsyncMock, vendor: MagicMock) -> None:
        advanced = _make_advanced_data()
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

    async def test_category_breakdown(self, session: AsyncMock, vendor: MagicMock) -> None:
        advanced = _make_advanced_data()
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

    async def test_top_and_bottom_items(self, session: AsyncMock, vendor: MagicMock) -> None:
        finance = _make_finance_data()
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

    async def test_get_menu(self, session: AsyncMock, vendor: MagicMock) -> None:
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

    async def test_get_reviews_summary(self, session: AsyncMock, vendor: MagicMock) -> None:
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

    async def test_caching_advanced(self, session: AsyncMock, vendor: MagicMock) -> None:
        advanced = _make_advanced_data()
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

    async def test_caching_finance(self, session: AsyncMock, vendor: MagicMock) -> None:
        finance = _make_finance_data()
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

    async def test_default_restaurant_id_used(self, session: AsyncMock, vendor: MagicMock) -> None:
        default_rid = uuid.uuid4()
        finance = _make_finance_data()
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

    async def test_explicit_restaurant_id_overrides_default(self, session: AsyncMock) -> None:
        default_rid = uuid.uuid4()
        explicit_rid = uuid.uuid4()
        vendor = _make_vendor(restaurant_ids=[explicit_rid])
        finance = _make_finance_data()
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
