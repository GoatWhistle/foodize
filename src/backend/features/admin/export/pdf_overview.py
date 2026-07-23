import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.crud import translate_status
from features.admin.schemas import PlatformStats
from shared.i18n import DEFAULT_LANGUAGE, translate

from .pdf_base import _PDF, _date_format

_ROLE_KEYS = {
    "customers:read": "customers",
    "restaurants:create": "vendors",
    "staff:profile:read": "staff",
    "admin": "admin",
}


async def export_overview_pdf(
    session: AsyncSession,
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
