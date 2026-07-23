import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, patch

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin.export import (
    export_analytics_pdf,
    export_finance_pdf,
    export_overview_pdf,
)
from features.admin.schemas import (
    AdvancedAnalytics,
    AnalyticsPoint,
    FinanceAnalytics,
    FinanceSeriesPoint,
    FinanceTopItem,
    FinanceTopRestaurant,
    PlatformStats,
    StatsGrowthPoint,
)


class DummyPDF:
    def __init__(self, *_args: object, **_kwargs: object) -> None:
        self.page = 1

    def section(self, *args: object, **kwargs: object) -> None:
        pass

    def row(self, *args: object, **kwargs: object) -> None:
        pass

    def info_row(self, *args: object, **kwargs: object) -> None:
        pass

    def ln(self, *args: object, **kwargs: object) -> None:
        pass

    def set_font(self, *args: object, **kwargs: object) -> None:
        pass

    def output(self, *_args: object, **_kwargs: object) -> bytes:
        return b"mock_pdf_bytes"


async def test_export_finance_pdf() -> None:
    mock_session = AsyncMock(spec=AsyncSession)
    mock_analytics = FinanceAnalytics(
        revenue_by_day=[FinanceSeriesPoint(date=datetime.now(UTC).date(), value=1000)],
        average_check=500.0,
        top_restaurants=[
            FinanceTopRestaurant(
                restaurant_id=uuid.uuid4(), name="Rest 1", revenue=1000, orders_count=2
            )
        ],
        top_items=[
            FinanceTopItem(menu_item_id=uuid.uuid4(), name="Dish 1", quantity=5, revenue=500)
        ],
        cancelled_orders=1,
        total_orders=10,
        completed_orders=9,
        conversion_percent=90.0,
        total_revenue=4500,
        revenue_growth_pct=10.0,
    )
    with (
        patch(
            "features.admin.crud.get_finance_analytics",
            new_callable=AsyncMock,
            return_value=mock_analytics,
        ),
        patch("features.admin.export.pdf_finance._PDF", DummyPDF),
    ):
        today = datetime.now(UTC).date()
        res = await export_finance_pdf(mock_session, today, today)
        assert res == b"mock_pdf_bytes"


async def test_export_analytics_pdf() -> None:
    mock_session = AsyncMock(spec=AsyncSession)
    mock_analytics = AdvancedAnalytics(
        hourly_load=[AnalyticsPoint(label="12", value=5)],
        category_revenue=[AnalyticsPoint(label="Pizza", value=2000)],
        aov_dynamics=[FinanceSeriesPoint(date=datetime.now(UTC).date(), value=500)],
        retention=[],
    )
    with (
        patch(
            "features.admin.crud.get_advanced_analytics",
            new_callable=AsyncMock,
            return_value=mock_analytics,
        ),
        patch("features.admin.export.pdf_analytics._PDF", DummyPDF),
    ):
        res = await export_analytics_pdf(mock_session)
        assert res == b"mock_pdf_bytes"


async def test_export_overview_pdf() -> None:
    mock_session = AsyncMock(spec=AsyncSession)
    mock_stats = PlatformStats(
        users_by_permission={"customers:read": 10},
        users_by_role={"CUSTOMER": 10},
        total_users=10,
        orders_by_status={"COMPLETED": 5},
        total_restaurants=1,
        total_vendors=1,
        growth={"users": [StatsGrowthPoint(date=datetime.now(UTC).date(), count=1)]},
    )
    with (
        patch(
            "features.admin.crud.get_platform_stats",
            new_callable=AsyncMock,
            return_value=mock_stats,
        ),
        patch("features.admin.export.pdf_overview._PDF", DummyPDF),
    ):
        res = await export_overview_pdf(mock_session)
        assert res == b"mock_pdf_bytes"
