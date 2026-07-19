import asyncio
import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.crud import STATUS_RU
from features.admin.schemas import AdvancedAnalytics, FinanceAnalytics, PlatformStats

from .pdf_base import _PDF

_ROLE_LABELS = {
    "customers:read": "Клиенты",
    "restaurants:create": "Вендоры",
    "staff:profile:read": "Персонал (сотрудники)",
    "admin": "Администраторы",
}

_DATE_FORMAT = "%d.%m.%Y"


def _period_line(date_from: date | None, date_to: date | None) -> str:
    return (
        f"{date_from.strftime(_DATE_FORMAT) if date_from else '—'}"
        f" — {date_to.strftime(_DATE_FORMAT) if date_to else '—'}"
    )


def _format_rub(amount: float) -> str:
    return f"{int(amount):,}".replace(",", " ")


def _finance_kpi_section(pdf: _PDF, analytics: FinanceAnalytics) -> None:
    pdf.section("Ключевые показатели")
    pdf.row([("Показатель", 120), ("Значение", 75)], header=True)
    revenue_fmt = f"{analytics.total_revenue:,.0f} ₽".replace(",", " ")
    pdf.row([("Общая выручка", 120), (revenue_fmt, 75)])
    pdf.row([("Всего заказов", 120), (str(analytics.total_orders), 75)])
    pdf.row([("Выполнено заказов", 120), (str(analytics.completed_orders), 75)])
    pdf.row([("Отменено заказов", 120), (str(analytics.cancelled_orders), 75)])
    pdf.row([("Конверсия", 120), (f"{analytics.conversion_percent}%", 75)])
    pdf.row([("Средний чек (AOV)", 120), (f"{analytics.average_check:.0f} ₽", 75)])
    pdf.ln(5)


def _finance_details_sections(pdf: _PDF, analytics: FinanceAnalytics) -> None:
    pdf.section("Выручка по дням")
    pdf.row([("Дата", 90), ("Выручка (₽)", 105)], header=True)
    for point in analytics.revenue_by_day:
        pdf.row([(point.date.strftime(_DATE_FORMAT), 90), (_format_rub(point.value), 105)])
    pdf.ln(5)

    pdf.section("Топ ресторанов по выручке")
    pdf.row([("#", 12), ("Название", 100), ("Выручка (₽)", 55), ("Заказов", 28)], header=True)
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

    pdf.section("Топ блюд по продажам")
    pdf.row([("#", 12), ("Блюдо", 100), ("Продано", 33), ("Выручка (₽)", 50)], header=True)
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
) -> bytes:
    pdf = _PDF(title)
    pdf.set_font("dv", "", 9)

    pdf.info_row("Период отчёта", _period_line(date_from, date_to))
    growth_str = (
        f"{analytics.revenue_growth_pct:+.1f}%" if analytics.revenue_growth_pct is not None else "—"
    )
    pdf.info_row("Рост к предыдущему периоду", growth_str)
    pdf.ln(5)

    _finance_kpi_section(pdf, analytics)
    _finance_details_sections(pdf, analytics)

    return bytes(pdf.output())


async def export_finance_pdf(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    vendor_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
) -> bytes:
    analytics = await crud.get_finance_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor_id,
        restaurant_id=restaurant_id,
    )
    return await asyncio.to_thread(
        _build_finance_pdf, "Финансовый отчёт — Foodize", analytics, date_from, date_to
    )


def _build_analytics_pdf(
    title: str,
    analytics: AdvancedAnalytics,
    date_from: date | None,
    date_to: date | None,
) -> bytes:
    pdf = _PDF(title)
    pdf.info_row("Период анализа", _period_line(date_from, date_to))
    pdf.ln(5)

    pdf.section("Почасовая нагрузка на платформу")
    pdf.row([("Час суток", 60), ("Заказов", 60)], header=True)
    for point in analytics.hourly_load:
        pdf.row([(f"{point.label}:00", 60), (str(point.value), 60)])
    pdf.ln(5)

    pdf.section("Выручка по категориям меню")
    pdf.row([("Категория", 100), ("Выручка (₽)", 55), ("Доля (%)", 40)], header=True)
    total_cat = sum(p.value for p in analytics.category_revenue) or 1
    for point in analytics.category_revenue:
        pct = round(point.value / total_cat * 100, 1)
        pdf.row([(point.label, 100), (_format_rub(point.value), 55), (f"{pct}%", 40)])
    pdf.ln(5)

    pdf.section("Динамика среднего чека (AOV)")
    pdf.row([("Дата", 90), ("Средний чек (₽)", 105)], header=True)
    for aov_point in analytics.aov_dynamics:
        pdf.row(
            [
                (aov_point.date.strftime(_DATE_FORMAT), 90),
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
) -> bytes:
    analytics = await crud.get_advanced_analytics(
        session,
        date_from=date_from,
        date_to=date_to,
        vendor_id=vendor_id,
        restaurant_id=restaurant_id,
    )
    return await asyncio.to_thread(
        _build_analytics_pdf, "Аналитический отчёт — Foodize", analytics, date_from, date_to
    )


async def export_overview_pdf(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
) -> bytes:
    stats: PlatformStats = await crud.get_platform_stats(session)
    return await asyncio.to_thread(_build_overview_pdf, stats)


def _infer_role_label(perm_key: str) -> str:
    for marker, label in _ROLE_LABELS.items():
        if marker in perm_key:
            return label
    return perm_key.replace(":", " ").title()


def _overview_growth_section(pdf: _PDF, stats: PlatformStats) -> None:
    pdf.section("Рост платформы (последние 14 дней)")
    growth_users = {p.date: p.count for p in stats.growth.get("users", [])}
    growth_orders = {p.date: p.count for p in stats.growth.get("orders", [])}
    all_dates = sorted(set(growth_users) | set(growth_orders))
    pdf.row([("Дата", 65), ("Новых пользователей", 65), ("Новых заказов", 65)], header=True)
    for report_date in all_dates:
        pdf.row(
            [
                (report_date.strftime(_DATE_FORMAT), 65),
                (str(growth_users.get(report_date, 0)), 65),
                (str(growth_orders.get(report_date, 0)), 65),
            ]
        )


def _build_overview_pdf(stats: PlatformStats) -> bytes:
    pdf = _PDF("Обзор платформы — Foodize")

    pdf.info_row("Всего пользователей", str(stats.total_users))
    pdf.info_row("Всего ресторанов", str(stats.total_restaurants))
    pdf.info_row("Всего вендоров", str(stats.total_vendors))
    pdf.ln(5)

    pdf.section("Состав пользователей по ролям")
    pdf.row([("Роль", 120), ("Количество", 75)], header=True)
    for perm, count in stats.users_by_permission.items():
        pdf.row([(_infer_role_label(perm), 120), (str(count), 75)])
    pdf.ln(5)

    pdf.section("Заказы по статусам")
    pdf.row([("Статус", 120), ("Кол-во", 75)], header=True)
    for status, count in stats.orders_by_status.items():
        pdf.row([(STATUS_RU.get(status, status), 120), (str(count), 75)])
    pdf.ln(5)

    _overview_growth_section(pdf, stats)

    return bytes(pdf.output())
