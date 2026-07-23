from typing import TYPE_CHECKING

from infra.llm import ToolSpec
from shared.i18n import DEFAULT_LANGUAGE, translate

if TYPE_CHECKING:
    from infra.llm.base import JsonObject


def build_advisor_tools(language: str = DEFAULT_LANGUAGE) -> list[ToolSpec]:
    period: JsonObject = {
        "type": "integer",
        "description": translate("prompts.advisor.tools.periodDays", language),
    }
    restaurant: JsonObject = {
        "type": "string",
        "description": translate("prompts.advisor.tools.restaurantId", language),
    }
    period_schema: JsonObject = {
        "type": "object",
        "properties": {"period_days": period, "restaurant_id": restaurant},
    }
    restaurant_schema: JsonObject = {
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
