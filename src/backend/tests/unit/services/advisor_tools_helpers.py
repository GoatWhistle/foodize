import uuid
from collections.abc import Iterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_advisor.tools import build_advisor_executor
from infra.llm import ToolExecutor


def make_advisor_vendor(restaurant_ids: list[uuid.UUID] | None = None) -> MagicMock:
    vendor = MagicMock()
    vendor.id = uuid.uuid4()
    restaurants = []
    for rid in restaurant_ids or []:
        restaurant = MagicMock()
        restaurant.id = rid
        restaurants.append(restaurant)
    vendor.restaurants = restaurants
    return vendor


def make_finance_data() -> MagicMock:
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


def make_advanced_data() -> MagicMock:
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


class AdvisorExecutorTestBase:
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
        return make_advisor_vendor()

    @pytest.fixture
    def executor(self, vendor: MagicMock) -> ToolExecutor:
        return build_advisor_executor(vendor)
