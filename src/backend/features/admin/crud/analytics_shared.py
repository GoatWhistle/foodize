from datetime import date, datetime, timedelta

from features.admin.schemas import FinanceSeriesPoint
from shared.enums.category import Category
from shared.enums.order_status import OrderStatus

CATEGORY_RU = {
    Category.SHAURMA.value: "Шаурма",
    Category.BURGER.value: "Бургеры",
    Category.PIZZA.value: "Пицца",
    Category.SUSHI.value: "Суши и Роллы",
    Category.DRINK.value: "Напитки",
    Category.SNACK.value: "Снеки",
    Category.DESSERT.value: "Десерты",
    Category.SOUP.value: "Супы",
    Category.SALAD.value: "Салаты",
}

STATUS_RU = {
    OrderStatus.PENDING.value: "Ожидается",
    OrderStatus.ACCEPTED.value: "Принят",
    OrderStatus.READY.value: "Готово",
    OrderStatus.COMPLETED.value: "Завершен",
    OrderStatus.CANCELLED.value: "Отменен",
}


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


def parse_day(value) -> date:
    if isinstance(value, str):
        return date.fromisoformat(value)
    if isinstance(value, datetime):
        return value.date()
    return value
