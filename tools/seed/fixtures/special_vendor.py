from typing import Any

from shared.enums.category import Category

SPECIAL_VENDOR_PHONE = "+79608185075"
SPECIAL_VENDOR_RESTAURANT = "Борода"
SPECIAL_VENDOR_ADDRESS = "ул. Бородинская, 1"
SPECIAL_VENDOR_ITEMS: list[dict[str, Any]] = [
    {
        "name": "Шава гавайская",
        "description": "Шаурма с ананасом, курицей и сыром",
        "price": 7777,
        "category": Category.SHAURMA,
        "prep_time_minutes": 12,
    },
    {
        "name": "Кола",
        "description": "Газировка 0.5 л",
        "price": 150,
        "category": Category.DRINK,
        "prep_time_minutes": 1,
    },
    {
        "name": "Апельсиновый сок",
        "description": "Свежевыжатый, 0.3 л",
        "price": 250,
        "category": Category.DRINK,
        "prep_time_minutes": 2,
    },
    {
        "name": "Айран",
        "description": "Кисломолочный напиток, 0.5 л",
        "price": 120,
        "category": Category.DRINK,
        "prep_time_minutes": 1,
    },
]
