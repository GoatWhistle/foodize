import asyncio
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.schemas import AdvancedAnalytics
from shared.i18n import DEFAULT_LANGUAGE, translate

from .pdf_base import _PDF, _date_format, _format_rub, _period_line


def build_analytics_pdf(
    title: str,
    analytics: AdvancedAnalytics,
    date_from: date | None,
    date_to: date | None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    pdf = _PDF(title, language=language)
    pdf.info_row(
        translate("reports.analytics.period", language),
        _period_line(date_from, date_to, language),
    )
    pdf.ln(5)

    pdf.section(translate("reports.analytics.hourlyLoadSection", language))
    pdf.row(
        [
            (translate("reports.analytics.hourOfDay", language), 60),
            (translate("reports.analytics.ordersColumn", language), 60),
        ],
        header=True,
    )
    for point in analytics.hourly_load:
        pdf.row([(f"{point.label}:00", 60), (str(point.value), 60)])
    pdf.ln(5)

    pdf.section(translate("reports.analytics.categoryRevenueSection", language))
    pdf.row(
        [
            (translate("reports.analytics.category", language), 100),
            (translate("reports.analytics.revenueColumn", language), 55),
            (translate("reports.analytics.shareColumn", language), 40),
        ],
        header=True,
    )
    total_cat = sum(p.value for p in analytics.category_revenue) or 1
    for point in analytics.category_revenue:
        pct = round(point.value / total_cat * 100, 1)
        pdf.row([(point.label, 100), (_format_rub(point.value), 55), (f"{pct}%", 40)])
    pdf.ln(5)

    pdf.section(translate("reports.analytics.aovSection", language))
    pdf.row(
        [
            (translate("reports.analytics.date", language), 90),
            (translate("reports.analytics.averageCheckColumn", language), 105),
        ],
        header=True,
    )
    date_format = _date_format(language)
    for aov_point in analytics.aov_dynamics:
        pdf.row(
            [
                (aov_point.date.strftime(date_format), 90),
                (_format_rub(aov_point.value), 105),
            ]
        )

    return bytes(pdf.output())


async def export_analytics_pdf(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    vendor_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    analytics = await crud.get_advanced_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor_id,
        restaurant_id=restaurant_id,
        language=language,
    )
    return await asyncio.to_thread(
        build_analytics_pdf,
        translate("reports.analytics.title", language),
        analytics,
        date_from,
        date_to,
        language,
    )
