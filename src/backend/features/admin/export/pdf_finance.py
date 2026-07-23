import asyncio
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.schemas import FinanceAnalytics
from shared.i18n import DEFAULT_LANGUAGE, translate

from .pdf_base import _PDF, _date_format, _format_rub, _period_line


def _finance_kpi_section(pdf: _PDF, analytics: FinanceAnalytics, language: str) -> None:
    pdf.section(translate("reports.finance.kpiSection", language))
    pdf.row(
        [
            (translate("reports.finance.metric", language), 120),
            (translate("reports.finance.value", language), 75),
        ],
        header=True,
    )
    revenue_fmt = translate(
        "reports.finance.amountRub",
        language,
        amount=f"{analytics.total_revenue:,.0f}".replace(",", " "),
    )
    pdf.row([(translate("reports.finance.totalRevenue", language), 120), (revenue_fmt, 75)])
    pdf.row(
        [
            (translate("reports.finance.totalOrders", language), 120),
            (str(analytics.total_orders), 75),
        ]
    )
    pdf.row(
        [
            (translate("reports.finance.completedOrders", language), 120),
            (str(analytics.completed_orders), 75),
        ]
    )
    pdf.row(
        [
            (translate("reports.finance.cancelledOrders", language), 120),
            (str(analytics.cancelled_orders), 75),
        ]
    )
    pdf.row(
        [
            (translate("reports.finance.conversion", language), 120),
            (f"{analytics.conversion_percent}%", 75),
        ]
    )
    average_check = translate(
        "reports.finance.amountRub", language, amount=f"{analytics.average_check:.0f}"
    )
    pdf.row([(translate("reports.finance.averageCheck", language), 120), (average_check, 75)])
    pdf.ln(5)


def _finance_details_sections(pdf: _PDF, analytics: FinanceAnalytics, language: str) -> None:
    date_format = _date_format(language)

    pdf.section(translate("reports.finance.revenueByDaySection", language))
    pdf.row(
        [
            (translate("reports.finance.date", language), 90),
            (translate("reports.finance.revenueColumn", language), 105),
        ],
        header=True,
    )
    for point in analytics.revenue_by_day:
        pdf.row([(point.date.strftime(date_format), 90), (_format_rub(point.value), 105)])
    pdf.ln(5)

    pdf.section(translate("reports.finance.topRestaurantsSection", language))
    pdf.row(
        [
            (translate("reports.finance.index", language), 12),
            (translate("reports.finance.name", language), 100),
            (translate("reports.finance.revenueColumn", language), 55),
            (translate("reports.finance.ordersColumn", language), 28),
        ],
        header=True,
    )
    for index, top_restaurant in enumerate(analytics.top_restaurants, 1):
        pdf.row(
            [
                (str(index), 12),
                (top_restaurant.name, 100),
                (_format_rub(top_restaurant.revenue), 55),
                (str(top_restaurant.orders_count), 28),
            ]
        )
    pdf.ln(5)

    pdf.section(translate("reports.finance.topItemsSection", language))
    pdf.row(
        [
            (translate("reports.finance.index", language), 12),
            (translate("reports.finance.item", language), 100),
            (translate("reports.finance.soldColumn", language), 33),
            (translate("reports.finance.revenueColumn", language), 50),
        ],
        header=True,
    )
    for index, top_item in enumerate(analytics.top_items, 1):
        pdf.row(
            [
                (str(index), 12),
                (top_item.name, 100),
                (str(top_item.quantity), 33),
                (_format_rub(top_item.revenue), 50),
            ]
        )


def build_finance_pdf(
    title: str,
    analytics: FinanceAnalytics,
    date_from: date | None,
    date_to: date | None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    pdf = _PDF(title, language=language)
    pdf.set_font("dv", "", 9)

    pdf.info_row(
        translate("reports.finance.period", language),
        _period_line(date_from, date_to, language),
    )
    growth_str = (
        f"{analytics.revenue_growth_pct:+.1f}%"
        if analytics.revenue_growth_pct is not None
        else translate("reports.common.dash", language)
    )
    pdf.info_row(translate("reports.finance.growth", language), growth_str)
    pdf.ln(5)

    _finance_kpi_section(pdf, analytics, language)
    _finance_details_sections(pdf, analytics, language)

    return bytes(pdf.output())


async def export_finance_pdf(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    vendor_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    analytics = await crud.get_finance_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor_id,
        restaurant_id=restaurant_id,
    )
    return await asyncio.to_thread(
        build_finance_pdf,
        translate("reports.finance.title", language),
        analytics,
        date_from,
        date_to,
        language,
    )
