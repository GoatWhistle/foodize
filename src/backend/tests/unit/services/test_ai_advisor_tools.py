import json
import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_advisor.tools import (
    _dumps,
    _period_range,
    _restaurant_id,
    build_advisor_executor,
)
from infra.llm import ToolCall


class TestDumps:
    def test_ascii(self):
        result = _dumps({"key": "значение"})
        assert "значение" in result

    def test_datetime_default(self):
        from datetime import date
        result = _dumps({"d": date(2024, 1, 1)})
        assert "2024-01-01" in result

    def test_returns_string(self):
        assert isinstance(_dumps({"a": 1}), str)


class TestPeriodRange:
    def test_default_30_days(self):
        start, end = _period_range({})
        assert (end - start).days == 29

    def test_custom_period(self):
        start, end = _period_range({"period_days": 7})
        assert (end - start).days == 6

    def test_clamp_max_365(self):
        start, end = _period_range({"period_days": 1000})
        assert (end - start).days == 364

    def test_clamp_min_1(self):
        start, end = _period_range({"period_days": 1})
        assert (end - start).days == 0

    def test_invalid_type_fallback(self):
        start, end = _period_range({"period_days": "bad"})
        assert (end - start).days == 29

    def test_none_fallback(self):
        start, end = _period_range({"period_days": None})
        assert (end - start).days == 29

    def test_end_is_today(self):
        _, end = _period_range({})
        today = datetime.now(UTC).date()
        assert end == today


class TestRestaurantId:
    def test_none_when_missing(self):
        assert _restaurant_id({}) is None

    def test_none_when_empty_string(self):
        assert _restaurant_id({"restaurant_id": ""}) is None

    def test_valid_uuid(self):
        rid = uuid.uuid4()
        result = _restaurant_id({"restaurant_id": str(rid)})
        assert result == rid

    def test_invalid_raises(self):
        with pytest.raises(ValueError, match="invalid restaurant_id"):
            _restaurant_id({"restaurant_id": "not-a-uuid"})


def _make_vendor():
    vendor = MagicMock()
    vendor.id = uuid.uuid4()
    return vendor


def _make_finance_data():
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


def _make_advanced_data():
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
    def session(self):
        return AsyncMock()

    @pytest.fixture(autouse=True)
    def _mock_session_factory(self, session):
        mock_cm = AsyncMock()
        mock_cm.__aenter__ = AsyncMock(return_value=session)
        mock_cm.__aexit__ = AsyncMock(return_value=False)
        with patch("features.ai_advisor.tools.db_helper") as mock_db:
            mock_db.session_factory.return_value = mock_cm
            yield mock_db

    @pytest.fixture
    def vendor(self):
        return _make_vendor()

    @pytest.fixture
    def executor(self, vendor):
        return build_advisor_executor(vendor)

    @pytest.mark.asyncio
    async def test_unknown_tool(self, executor):
        call = ToolCall(id="t1", name="nonexistent", arguments={})
        result = json.loads(await executor(call))
        assert "error" in result
        assert "Unknown tool" in result["error"]

    @pytest.mark.asyncio
    async def test_sales_summary(self, session, vendor):
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

    @pytest.mark.asyncio
    async def test_peak_hours(self, session, vendor):
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

    @pytest.mark.asyncio
    async def test_category_breakdown(self, session, vendor):
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

    @pytest.mark.asyncio
    async def test_top_and_bottom_items(self, session, vendor):
        finance = _make_finance_data()
        bottom = [{"name": "Редкость", "category": "burgers", "price": 300, "is_available": True, "sold_qty": 0}]
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.tools.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=finance,
        ), patch(
            "features.ai_advisor.crud.get_bottom_items",
            new_callable=AsyncMock,
            return_value=bottom,
        ):
            call = ToolCall(id="t1", name="get_top_and_bottom_items", arguments={"period_days": 30})
            result = json.loads(await execute(call))
        assert "top_items" in result
        assert "bottom_items" in result
        assert result["bottom_items"][0]["name"] == "Редкость"

    @pytest.mark.asyncio
    async def test_get_menu(self, session, vendor):
        menu_items = [{"restaurant": "R1", "name": "Бургер", "category": "burgers", "price": 250, "is_available": True}]
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

    @pytest.mark.asyncio
    async def test_get_reviews_summary(self, session, vendor):
        reviews = {"average_rating": 4.5, "review_count": 10, "distribution": {5: 8, 4: 2}, "recent": []}
        execute = build_advisor_executor(vendor)
        with patch(
            "features.ai_advisor.crud.get_reviews_summary",
            new_callable=AsyncMock,
            return_value=reviews,
        ):
            call = ToolCall(id="t1", name="get_reviews_summary", arguments={})
            result = json.loads(await execute(call))
        assert result["average_rating"] == 4.5

    @pytest.mark.asyncio
    async def test_caching_advanced(self, session, vendor):
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

    @pytest.mark.asyncio
    async def test_caching_finance(self, session, vendor):
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

    @pytest.mark.asyncio
    async def test_default_restaurant_id_used(self, session, vendor):
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

    @pytest.mark.asyncio
    async def test_explicit_restaurant_id_overrides_default(self, session, vendor):
        default_rid = uuid.uuid4()
        explicit_rid = uuid.uuid4()
        finance = _make_finance_data()
        execute = build_advisor_executor(vendor, default_restaurant_id=default_rid)
        with patch(
            "features.ai_advisor.tools.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=finance,
        ) as mock_fin:
            call = ToolCall(id="t1", name="get_sales_summary", arguments={"restaurant_id": str(explicit_rid)})
            await execute(call)
            _, kwargs = mock_fin.call_args
            assert kwargs.get("restaurant_id") == explicit_rid
