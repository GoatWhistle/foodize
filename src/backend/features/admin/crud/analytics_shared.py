from datetime import date, datetime, timedelta

from features.admin.schemas import FinanceSeriesPoint
from shared.exceptions.internal import UnexpectedTypeError
from shared.i18n import DEFAULT_LANGUAGE, translate


def translate_category(value: str | None, language: str = DEFAULT_LANGUAGE) -> str:
    if not value:
        return ""
    translated = translate(f"reports.category.{value}", language)
    return value if translated == f"reports.category.{value}" else translated


def translate_status(value: str | None, language: str = DEFAULT_LANGUAGE) -> str:
    if not value:
        return ""
    translated = translate(f"reports.orderStatus.{value}", language)
    return value if translated == f"reports.orderStatus.{value}" else translated


def finance_points(
    counts: dict[date, int], start_date: date, days: int
) -> list[FinanceSeriesPoint]:
    return [
        FinanceSeriesPoint(
            date=start_date + timedelta(days=index),
            value=counts.get(start_date + timedelta(days=index), 0),
        )
        for index in range(days)
    ]


def parse_day(value: object) -> date:
    if isinstance(value, str):
        return date.fromisoformat(value)
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    raise UnexpectedTypeError("date or datetime", value)
