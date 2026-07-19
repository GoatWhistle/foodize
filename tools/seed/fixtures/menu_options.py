from typing import Any

from shared.enums.category import Category

OPTION_GROUP_PRESETS: dict[str, list[dict[str, Any]]] = {
    "Шаурма классик": [
        {
            "name": "Соус",
            "selection_type": "single",
            "is_required": True,
            "min_selected": 1,
            "max_selected": 1,
            "sort_order": 10,
            "options": [
                {"name": "Чесночный", "price_delta": 0, "sort_order": 0},
                {"name": "Томатный", "price_delta": 0, "sort_order": 1},
                {"name": "Острый", "price_delta": 15, "sort_order": 2},
            ],
        },
        {
            "name": "Добавки",
            "selection_type": "multiple",
            "is_required": False,
            "min_selected": 0,
            "max_selected": 2,
            "sort_order": 20,
            "options": [
                {"name": "Сыр", "price_delta": 40, "sort_order": 0},
                {"name": "Халапеньо", "price_delta": 25, "sort_order": 1},
            ],
        },
    ],
    "Чизбургер": [
        {
            "name": "Соус",
            "selection_type": "single",
            "is_required": True,
            "min_selected": 1,
            "max_selected": 1,
            "sort_order": 10,
            "options": [
                {"name": "Кетчуп", "price_delta": 0, "sort_order": 0},
                {"name": "Майонез", "price_delta": 0, "sort_order": 1},
                {"name": "Барбекю", "price_delta": 20, "sort_order": 2},
            ],
        },
        {
            "name": "Дополнительно",
            "selection_type": "multiple",
            "is_required": False,
            "min_selected": 0,
            "max_selected": 3,
            "sort_order": 20,
            "options": [
                {"name": "Бекон", "price_delta": 60, "sort_order": 0},
                {"name": "Грибы", "price_delta": 35, "sort_order": 1},
            ],
        },
    ],
    "Ролл Калифорния": [
        {
            "name": "Соус",
            "selection_type": "single",
            "is_required": True,
            "min_selected": 1,
            "max_selected": 1,
            "sort_order": 10,
            "options": [
                {"name": "Соевый", "price_delta": 0, "sort_order": 0},
                {"name": "Унаги", "price_delta": 20, "sort_order": 1},
            ],
        },
    ],
    "Маргарита": [
        {
            "name": "Дополнительный сыр",
            "selection_type": "single",
            "is_required": False,
            "min_selected": 0,
            "max_selected": 1,
            "sort_order": 10,
            "options": [
                {"name": "Пармезан", "price_delta": 50, "sort_order": 0},
            ],
        },
    ],
}

UNAVAILABLE_ITEM_NAMES: set[str] = {"Луковые кольца", "Нигири с лососем (2 шт)"}
DELETED_ITEM: dict[str, Any] = {
    "name": "Сезонный напиток (снят с продажи)",
    "description": "Позиция удалена из меню, но хранится в истории заказов.",
    "price": 199,
    "category": Category.DRINK,
    "prep_time_minutes": 2,
}
