from typing import Any

from shared.enums.category import Category

REVIEW_TEXTS: list[tuple[int, str]] = [
    (
        5,
        "Отличное место! Шаурма свежая, всё горячее, персонал вежливый. Буду приходить снова.",
    ),
    (5, "Лучшие роллы в городе, без преувеличений. Рыба свежайшая, подача красивая."),
    (4, "Вкусно, быстро, цены адекватные. Единственный минус — очередь в обед."),
    (
        4,
        "Бургеры отличные, котлета сочная. Картошка могла быть горячее, но в целом зашло.",
    ),
    (5, "Пицца просто огонь! Тесто воздушное, начинки много. Рекомендую четыре сыра."),
    (3, "Нормально, но ждал дольше, чем обещали. На вкус без нареканий."),
    (5, "Мисо-суп восхитительный, рамен тоже. Атмосфера приятная, вернусь с друзьями."),
    (4, "Хороший фастфуд без лишних понтов. Шаурма большая, цена честная."),
    (5, "Заказываю здесь каждую неделю. Стабильное качество — это главное."),
    (2, "Ждал 40 минут вместо 15. Еда нормальная, но время — это деньги."),
]

EXTENDED_PROMOS: list[dict[str, Any]] = [
    {
        "restaurant_index": 0,
        "code": "WELCOME1",
        "discount_type": "PERCENT",
        "discount_value": 25,
        "max_uses": 500,
        "first_order_only": True,
        "min_order_amount": 300,
    },
    {
        "restaurant_index": 0,
        "code": "DRINKS30",
        "discount_type": "FIXED",
        "discount_value": 30,
        "max_uses": 200,
        "menu_category": Category.DRINK.value,
    },
    {
        "restaurant_index": 2,
        "code": "EXPIRED",
        "discount_type": "PERCENT",
        "discount_value": 50,
        "max_uses": 100,
        "expired": True,
    },
    {
        "restaurant_index": 3,
        "code": "PAUSED",
        "discount_type": "FIXED",
        "discount_value": 100,
        "max_uses": 100,
        "is_active": False,
    },
]

APPLIED_PROMO_CODE = "SHAUR10"

NOTIFICATIONS: list[dict[str, Any]] = [
    {
        "title": "Заказ принят",
        "message": "Ваш заказ принят рестораном и готовится.",
        "type": "ORDER_STATUS",
        "is_read": True,
    },
    {
        "title": "Заказ готов",
        "message": "Ваш заказ готов к выдаче. Приятного аппетита!",
        "type": "ORDER_STATUS",
        "is_read": False,
    },
    {
        "title": "Добро пожаловать в Foodize",
        "message": "Спасибо за регистрацию! Загляните в раздел избранного.",
        "type": "SYSTEM",
        "is_read": True,
    },
    {
        "title": "Промокод внутри",
        "message": "Используйте WELCOME1 и получите скидку 25% на первый заказ.",
        "type": "SYSTEM",
        "is_read": False,
    },
]
