import json
import uuid
from datetime import UTC, date, datetime, timedelta
from typing import Any

from database import db_helper
from features.admin.crud import get_advanced_analytics, get_finance_analytics, translate_category
from features.admin.schemas import AdvancedAnalytics, FinanceAnalytics
from features.ai_advisor import crud
from features.vendors.models import VendorProfile
from infra.llm import ToolCall, ToolExecutor, ToolSpec
from infra.llm.base import ToolInputError
from shared.dependencies.vendor_restaurant import get_vendor_restaurant_ids
from shared.i18n import DEFAULT_LANGUAGE, translate

_DEFAULT_PERIOD_DAYS = 30
_MAX_PERIOD_DAYS = 365


def build_advisor_tools(language: str = DEFAULT_LANGUAGE) -> list[ToolSpec]:
    period = {
        "type": "integer",
        "description": translate("prompts.advisor.tools.periodDays", language),
    }
    restaurant = {
        "type": "string",
        "description": translate("prompts.advisor.tools.restaurantId", language),
    }
    period_schema: dict[str, Any] = {
        "type": "object",
        "properties": {"period_days": period, "restaurant_id": restaurant},
    }
    restaurant_schema: dict[str, Any] = {
        "type": "object",
        "properties": {"restaurant_id": restaurant},
    }
    return [
        ToolSpec(
            name="get_sales_summary",
            description=translate("prompts.advisor.tools.salesSummary", language),
            input_schema=period_schema,
        ),
        ToolSpec(
            name="get_peak_hours",
            description=translate("prompts.advisor.tools.peakHours", language),
            input_schema=period_schema,
        ),
        ToolSpec(
            name="get_category_breakdown",
            description=translate("prompts.advisor.tools.categoryBreakdown", language),
            input_schema=period_schema,
        ),
        ToolSpec(
            name="get_top_and_bottom_items",
            description=translate("prompts.advisor.tools.topAndBottomItems", language),
            input_schema=period_schema,
        ),
        ToolSpec(
            name="get_menu",
            description=translate("prompts.advisor.tools.menu", language),
            input_schema=restaurant_schema,
        ),
        ToolSpec(
            name="get_reviews_summary",
            description=translate("prompts.advisor.tools.reviewsSummary", language),
            input_schema=restaurant_schema,
        ),
    ]


def _dumps(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False, default=str)


def _period_range(args: dict[str, Any]) -> tuple[date, date]:
    period = args.get("period_days") or _DEFAULT_PERIOD_DAYS
    try:
        period = max(1, min(int(period), _MAX_PERIOD_DAYS))
    except (TypeError, ValueError):
        period = _DEFAULT_PERIOD_DAYS
    end = datetime.now(UTC).date()
    start = end - timedelta(days=period - 1)
    return start, end


def _restaurant_id(args: dict[str, Any]) -> uuid.UUID | None:
    raw = args.get("restaurant_id")
    if not raw:
        return None
    try:
        return uuid.UUID(str(raw))
    except (TypeError, ValueError):
        raise ToolInputError(f"invalid restaurant_id: {raw!r} — provide a valid UUID") from None


def _localize_categories(rows: list[dict[str, Any]], language: str) -> None:
    for row in rows:
        row["category"] = translate_category(row["category"], language)


class _AdvisorToolRunner:
    def __init__(
        self,
        vendor: VendorProfile,
        default_restaurant_id: uuid.UUID | None = None,
        language: str = DEFAULT_LANGUAGE,
    ) -> None:
        self._vendor_id = vendor.id
        self._owned_restaurant_ids = get_vendor_restaurant_ids(vendor)
        self._default_restaurant_id = default_restaurant_id
        self._language = language
        self._advanced_cache: dict[tuple[date, date, uuid.UUID | None], AdvancedAnalytics] = {}
        self._finance_cache: dict[tuple[date, date, uuid.UUID | None], FinanceAnalytics] = {}

    def _resolve_restaurant(self, args: dict[str, Any]) -> uuid.UUID | None:
        restaurant_id = _restaurant_id(args)
        if restaurant_id is None:
            return self._default_restaurant_id
        if restaurant_id not in self._owned_restaurant_ids:
            raise ToolInputError(f"restaurant {restaurant_id} does not belong to this vendor")
        return restaurant_id

    async def _advanced(
        self, start: date, end: date, restaurant_id: uuid.UUID | None
    ) -> AdvancedAnalytics:
        key = (start, end, restaurant_id)
        if key not in self._advanced_cache:
            async with db_helper.session_factory() as session:
                self._advanced_cache[key] = await get_advanced_analytics(
                    session,
                    date_from=start,
                    date_to=end,
                    vendor_id=self._vendor_id,
                    restaurant_id=restaurant_id,
                    language=self._language,
                )
        return self._advanced_cache[key]

    async def _finance(
        self, start: date, end: date, restaurant_id: uuid.UUID | None
    ) -> FinanceAnalytics:
        key = (start, end, restaurant_id)
        if key not in self._finance_cache:
            async with db_helper.session_factory() as session:
                self._finance_cache[key] = await get_finance_analytics(
                    session,
                    date_from=start,
                    date_to=end,
                    vendor_id=self._vendor_id,
                    restaurant_id=restaurant_id,
                )
        return self._finance_cache[key]

    async def sales_summary(self, args: dict[str, Any]) -> str:
        start, end = _period_range(args)
        finance = await self._finance(start, end, self._resolve_restaurant(args))
        return _dumps(
            {
                "period": {"from": str(start), "to": str(end)},
                "total_revenue": finance.total_revenue,
                "average_check": finance.average_check,
                "total_orders": finance.total_orders,
                "completed_orders": finance.completed_orders,
                "cancelled_orders": finance.cancelled_orders,
                "conversion_percent": finance.conversion_percent,
                "revenue_growth_pct": finance.revenue_growth_pct,
                "top_items": [
                    {"name": i.name, "quantity": i.quantity, "revenue": i.revenue}
                    for i in finance.top_items
                ],
                "top_restaurants": [
                    {"name": r.name, "revenue": r.revenue, "orders": r.orders_count}
                    for r in finance.top_restaurants
                ],
            }
        )

    async def peak_hours(self, args: dict[str, Any]) -> str:
        start, end = _period_range(args)
        analytics = await self._advanced(start, end, self._resolve_restaurant(args))
        return _dumps(
            {
                "period": {"from": str(start), "to": str(end)},
                "hourly_load": [
                    {"hour": p.label, "orders": p.value} for p in analytics.hourly_load
                ],
            }
        )

    async def category_breakdown(self, args: dict[str, Any]) -> str:
        start, end = _period_range(args)
        analytics = await self._advanced(start, end, self._resolve_restaurant(args))
        return _dumps(
            {
                "period": {"from": str(start), "to": str(end)},
                "category_revenue": [
                    {"category": p.label, "revenue": p.value} for p in analytics.category_revenue
                ],
            }
        )

    async def top_and_bottom_items(self, args: dict[str, Any]) -> str:
        start, end = _period_range(args)
        restaurant_id = self._resolve_restaurant(args)
        finance = await self._finance(start, end, restaurant_id)
        async with db_helper.session_factory() as session:
            bottom_items = await crud.get_bottom_items(
                session,
                vendor_id=self._vendor_id,
                start_date=start,
                end_date=end,
                restaurant_id=restaurant_id,
            )
        _localize_categories(bottom_items, self._language)
        return _dumps(
            {
                "period": {"from": str(start), "to": str(end)},
                "top_items": [
                    {"name": i.name, "quantity": i.quantity, "revenue": i.revenue}
                    for i in finance.top_items
                ],
                "bottom_items": bottom_items,
            }
        )

    async def menu(self, args: dict[str, Any]) -> str:
        async with db_helper.session_factory() as session:
            menu_items = await crud.get_menu_overview(
                session, vendor_id=self._vendor_id, restaurant_id=self._resolve_restaurant(args)
            )
        _localize_categories(menu_items, self._language)
        return _dumps({"items": menu_items})

    async def reviews_summary(self, args: dict[str, Any]) -> str:
        async with db_helper.session_factory() as session:
            summary = await crud.get_reviews_summary(
                session, vendor_id=self._vendor_id, restaurant_id=self._resolve_restaurant(args)
            )
        return _dumps(summary)


def build_advisor_executor(
    vendor: VendorProfile,
    default_restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> ToolExecutor:
    runner = _AdvisorToolRunner(vendor, default_restaurant_id, language)
    handlers = {
        "get_sales_summary": runner.sales_summary,
        "get_peak_hours": runner.peak_hours,
        "get_category_breakdown": runner.category_breakdown,
        "get_top_and_bottom_items": runner.top_and_bottom_items,
        "get_menu": runner.menu,
        "get_reviews_summary": runner.reviews_summary,
    }

    async def execute(call: ToolCall) -> str:
        handler = handlers.get(call.name)
        if handler is None:
            return _dumps({"error": f"Unknown tool: {call.name}"})
        return await handler(call.arguments or {})

    return execute
