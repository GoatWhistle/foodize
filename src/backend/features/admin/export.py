import csv
import io
import uuid
from datetime import UTC, date, datetime

from fpdf import FPDF
from sqlalchemy.ext.asyncio import AsyncSession

from features.admin import crud
from features.admin.schemas import AdvancedAnalytics, FinanceAnalytics, PlatformStats
from shared.enums.order_status import OrderStatus

_FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
_FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


class _PDF(FPDF):
    def __init__(self, title: str):
        super().__init__()
        self.add_font("dv", "", _FONT_PATH)
        self.add_font("dv", "B", _FONT_BOLD_PATH)
        self.set_font("dv", "", 10)
        self._title = title
        self.add_page()
        self._draw_header()

    def _draw_header(self) -> None:
        self.set_font("dv", "B", 16)
        self.cell(0, 10, self._title, new_x="LMARGIN", new_y="NEXT", align="C")
        self.set_font("dv", "", 9)
        self.cell(
            0,
            6,
            f"Дата генерации: {datetime.now(UTC).strftime('%d.%m.%Y %H:%M')}",
            new_x="LMARGIN",
            new_y="NEXT",
            align="C",
        )
        self.ln(4)

    def section(self, label: str) -> None:
        self.set_font("dv", "B", 11)
        self.set_fill_color(240, 240, 240)
        self.cell(0, 8, label, new_x="LMARGIN", new_y="NEXT", fill=True)
        self.ln(2)

    def row(self, cells: list[tuple[str, int]], bold: bool = False) -> None:
        self.set_font("dv", "B" if bold else "", 9)
        for text, width in cells:
            self.cell(width, 7, str(text), border=1)
        self.ln()


def _make_csv(headers: list[str], rows: list[list]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    return buf.getvalue().encode("utf-8-sig")


async def export_users_csv(session: AsyncSession) -> bytes:
    users = await crud.get_all_users(session, offset=0, limit=1_000_000)
    headers = ["ID", "Имя", "Телефон", "Email", "Telegram", "Права", "Активен", "Дата регистрации"]
    rows = [
        [
            str(u.id),
            u.name or "",
            u.phone_number,
            u.email or "",
            u.telegram_username or "",
            ",".join(str(p) for p in (u.permissions or [])),
            "Да" if u.is_active else "Нет",
            u.created_at.strftime("%Y-%m-%d %H:%M"),
        ]
        for u in users
    ]
    return _make_csv(headers, rows)


async def export_orders_csv(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
    status: OrderStatus | None = None,
) -> bytes:
    orders = await crud.get_all_orders(
        session, status=status, date_from=date_from, date_to=date_to, offset=0, limit=1_000_000
    )
    headers = [
        "ID",
        "Номер",
        "Клиент",
        "Телефон клиента",
        "Ресторан",
        "Статус",
        "Сумма (₽)",
        "Причина отмены",
        "Дата создания",
    ]
    rows = [
        [
            str(o.id),
            getattr(o, "display_id", None) or str(o.id)[:8],
            o.user.name if o.user else "",
            o.user.phone_number if o.user else "",
            o.restaurant.name if o.restaurant else "",
            o.status,
            o.total_price,
            getattr(o, "cancellation_reason", "") or "",
            o.created_at.strftime("%Y-%m-%d %H:%M"),
        ]
        for o in orders
    ]
    return _make_csv(headers, rows)


async def export_restaurants_csv(session: AsyncSession) -> bytes:
    restaurants = await crud.get_all_restaurants(session, offset=0, limit=1_000_000)
    headers = [
        "ID",
        "Название",
        "Адрес",
        "Вендор",
        "Телефон вендора",
        "Статус модерации",
        "Рейтинг",
        "Отзывов",
        "Заказов",
        "Дата создания",
    ]
    rows = [
        [
            str(r.id),
            r.name,
            r.address,
            r.vendor_name or "",
            r.vendor_phone or "",
            r.moderation_status,
            r.average_rating,
            r.review_count,
            r.orders_count,
            r.created_at.strftime("%Y-%m-%d %H:%M"),
        ]
        for r in restaurants
    ]
    return _make_csv(headers, rows)


async def export_vendors_csv(session: AsyncSession) -> bytes:
    vendors = await crud.get_all_vendors(session, offset=0, limit=1_000_000)
    headers = ["ID", "Имя", "Телефон", "Статус", "Ресторанов", "Дата заявки"]
    rows = [
        [
            str(v.id),
            v.user.name if v.user else "",
            v.user.phone_number if v.user else "",
            v.approval_status,
            len(v.restaurants or []),
            v.created_at.strftime("%Y-%m-%d %H:%M"),
        ]
        for v in vendors
    ]
    return _make_csv(headers, rows)


async def export_reviews_csv(
    session: AsyncSession,
    min_rating: int | None = None,
    max_rating: int | None = None,
) -> bytes:
    reviews = await crud.get_all_reviews(session, offset=0, limit=1_000_000)
    if min_rating is not None:
        reviews = [r for r in reviews if r.rating >= min_rating]
    if max_rating is not None:
        reviews = [r for r in reviews if r.rating <= max_rating]
    headers = ["ID", "Ресторан", "Автор", "Рейтинг", "Текст", "Подтв. покупка", "Дата"]
    rows = [
        [
            str(r.id),
            r.restaurant_name or "",
            r.user_name or "",
            r.rating,
            r.text or "",
            "Да" if r.is_verified_purchase else "Нет",
            r.created_at.strftime("%Y-%m-%d %H:%M"),
        ]
        for r in reviews
    ]
    return _make_csv(headers, rows)


def _build_finance_pdf(
    title: str,
    analytics: FinanceAnalytics,
    date_from: date | None,
    date_to: date | None,
) -> bytes:
    pdf = _PDF(title)
    pdf.set_font("dv", "", 9)
    period = f"{date_from or '—'} – {date_to or '—'}"
    pdf.cell(0, 6, f"Период: {period}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.section("Сводка")
    cols = [
        ("Заказов всего", 48),
        ("Выполнено", 38),
        ("Отменено", 38),
        ("Конверсия %", 38),
        ("Ср. чек ₽", 34),
    ]
    pdf.row(cols, bold=True)
    pdf.row(
        [
            (analytics.total_orders, 48),
            (analytics.completed_orders, 38),
            (analytics.cancelled_orders, 38),
            (f"{analytics.conversion_percent}%", 38),
            (f"{analytics.average_check:.0f}", 34),
        ]
    )
    pdf.ln(4)

    pdf.section("Выручка по дням")
    pdf.row([("Дата", 60), ("Выручка (₽)", 60)], bold=True)
    for point in analytics.revenue_by_day:
        pdf.row([(point.date.strftime("%d.%m.%Y"), 60), (point.value, 60)])
    pdf.ln(4)

    pdf.section("Топ ресторанов")
    pdf.row([("Название", 90), ("Выручка (₽)", 50), ("Заказов", 36)], bold=True)
    for i, r in enumerate(analytics.top_restaurants, 1):
        pdf.row([(f"{i}. {r.name}", 90), (r.revenue, 50), (r.orders_count, 36)])
    pdf.ln(4)

    pdf.section("Топ блюд")
    pdf.row([("Блюдо", 90), ("Продано", 36), ("Выручка (₽)", 50)], bold=True)
    for i, item in enumerate(analytics.top_items, 1):
        pdf.row([(f"{i}. {item.name}", 90), (item.quantity, 36), (item.revenue, 50)])

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
    return _build_finance_pdf("Финансовый отчёт — Foodize", analytics, date_from, date_to)


def _build_analytics_pdf(
    title: str,
    analytics: AdvancedAnalytics,
    date_from: date | None,
    date_to: date | None,
) -> bytes:
    pdf = _PDF(title)
    pdf.set_font("dv", "", 9)
    pdf.cell(0, 6, f"Период: {date_from or '—'} – {date_to or '—'}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.section("Почасовая нагрузка")
    pdf.row([("Час", 40), ("Заказов", 40)], bold=True)
    for point in analytics.hourly_load:
        pdf.row([(point.label, 40), (point.value, 40)])
    pdf.ln(4)

    pdf.section("Выручка по категориям")
    pdf.row([("Категория", 80), ("Выручка (₽)", 50)], bold=True)
    total_cat = sum(p.value for p in analytics.category_revenue) or 1
    for point in analytics.category_revenue:
        pct = round(point.value / total_cat * 100, 1)
        pdf.row([(point.label, 80), (f"{int(point.value)} ({pct}%)", 50)])
    pdf.ln(4)

    pdf.section("Динамика среднего чека (AOV)")
    pdf.row([("Дата", 60), ("AOV (₽)", 50)], bold=True)
    for point in analytics.aov_dynamics:
        pdf.row([(point.date.strftime("%d.%m.%Y"), 60), (point.value, 50)])

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
    return _build_analytics_pdf("Аналитический отчёт — Foodize", analytics, date_from, date_to)


async def export_overview_pdf(
    session: AsyncSession,
    date_from: date | None = None,
    date_to: date | None = None,
) -> bytes:
    stats: PlatformStats = await crud.get_platform_stats(session)

    pdf = _PDF("Обзор платформы — Foodize")
    pdf.set_font("dv", "", 9)
    pdf.cell(0, 6, f"Период: {date_from or '—'} – {date_to or '—'}", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)

    pdf.section("Состав пользователей")
    pdf.row([("Право доступа", 100), ("Кол-во", 40)], bold=True)
    for perm, count in stats.users_by_permission.items():
        pdf.row([(perm, 100), (count, 40)])
    pdf.ln(4)

    pdf.section("Заказы по статусам")
    pdf.row([("Статус", 80), ("Кол-во", 40)], bold=True)
    for status, count in stats.orders_by_status.items():
        pdf.row([(status, 80), (count, 40)])
    pdf.ln(4)

    pdf.section("Рост платформы (последние 14 дней)")
    growth_users = {p.date: p.count for p in stats.growth.get("users", [])}
    growth_orders = {p.date: p.count for p in stats.growth.get("orders", [])}
    all_dates = sorted(set(list(growth_users.keys()) + list(growth_orders.keys())))
    pdf.row([("Дата", 60), ("Новых пользователей", 60), ("Новых заказов", 60)], bold=True)
    for d in all_dates:
        pdf.row(
            [
                (d.strftime("%d.%m.%Y"), 60),
                (growth_users.get(d, 0), 60),
                (growth_orders.get(d, 0), 60),
            ]
        )
    pdf.ln(4)

    pdf.set_font("dv", "B", 10)
    pdf.cell(
        0,
        7,
        f"Всего ресторанов: {stats.total_restaurants}    Вендоров: {stats.total_vendors}",
        new_x="LMARGIN",
        new_y="NEXT",
    )

    return bytes(pdf.output())
