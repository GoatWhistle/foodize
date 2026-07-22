import asyncio
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.crud import translate_status
from features.admin.schemas import AdvancedAnalytics, FinanceAnalytics, PlatformStats
from shared.i18n import DEFAULT_LANGUAGE, translate

from .pdf_base import _PDF

_ROLE_KEYS = {
    "customers:read": "customers",
    "restaurants:create": "vendors",
    "staff:profile:read": "staff",
    "admin": "admin",
}


def _date_format(language: str) -> str:
    return translate("reports.common.dateFormat", language)


def _period_line(date_from: date | None, date_to: date | None, language: str) -> str:
    date_format = _date_format(language)
    dash = translate("reports.common.dash", language)
    start = date_from.strftime(date_format) if date_from else dash
    end = date_to.strftime(date_format) if date_to else dash
    return f"{start} {dash} {end}"


def _format_rub(amount: float) -> str:
    return f"{int(amount):,}".replace(",", " ")


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


def _build_finance_pdf(
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
        _build_finance_pdf,
        translate("reports.finance.title", language),
        analytics,
        date_from,
        date_to,
        language,
    )


def _build_analytics_pdf(
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
        _build_analytics_pdf,
        translate("reports.analytics.title", language),
        analytics,
        date_from,
        date_to,
        language,
    )


async def export_overview_pdf(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    language: str = DEFAULT_LANGUAGE,
) -> bytes:
    stats: PlatformStats = await crud.get_platform_stats(session)
    return await asyncio.to_thread(_build_overview_pdf, stats, language)


def _infer_role_label(perm_key: str, language: str) -> str:
    for marker, role_key in _ROLE_KEYS.items():
        if marker in perm_key:
            return translate(f"reports.roles.{role_key}", language)
    return perm_key.replace(":", " ").title()


def _overview_growth_section(pdf: _PDF, stats: PlatformStats, language: str) -> None:
    pdf.section(translate("reports.overview.growthSection", language))
    growth_users = {p.date: p.count for p in stats.growth.get("users", [])}
    growth_orders = {p.date: p.count for p in stats.growth.get("orders", [])}
    all_dates = sorted(set(growth_users) | set(growth_orders))
    pdf.row(
        [
            (translate("reports.overview.date", language), 65),
            (translate("reports.overview.newUsers", language), 65),
            (translate("reports.overview.newOrders", language), 65),
        ],
        header=True,
    )
    date_format = _date_format(language)
    for report_date in all_dates:
        pdf.row(
            [
                (report_date.strftime(date_format), 65),
                (str(growth_users.get(report_date, 0)), 65),
                (str(growth_orders.get(report_date, 0)), 65),
            ]
        )


def _build_overview_pdf(stats: PlatformStats, language: str = DEFAULT_LANGUAGE) -> bytes:
    pdf = _PDF(translate("reports.overview.title", language), language=language)

    pdf.info_row(translate("reports.overview.totalUsers", language), str(stats.total_users))
    pdf.info_row(
        translate("reports.overview.totalRestaurants", language), str(stats.total_restaurants)
    )
    pdf.info_row(translate("reports.overview.totalVendors", language), str(stats.total_vendors))
    pdf.ln(5)

    pdf.section(translate("reports.overview.rolesSection", language))
    pdf.row(
        [
            (translate("reports.overview.role", language), 120),
            (translate("reports.overview.count", language), 75),
        ],
        header=True,
    )
    for perm, count in stats.users_by_permission.items():
        pdf.row([(_infer_role_label(perm, language), 120), (str(count), 75)])
    pdf.ln(5)

    pdf.section(translate("reports.overview.ordersByStatusSection", language))
    pdf.row(
        [
            (translate("reports.overview.status", language), 120),
            (translate("reports.overview.statusCount", language), 75),
        ],
        header=True,
    )
    for status, count in stats.orders_by_status.items():
        pdf.row([(translate_status(status, language), 120), (str(count), 75)])
    pdf.ln(5)

    _overview_growth_section(pdf, stats, language)

    return bytes(pdf.output())
