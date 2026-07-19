from typing import Any

from shared.enums.category import Category

SEED_RESTAURANTS: list[dict[str, Any]] = [
    {
        "vendor_index": 0,
        "name": "Шаурма у Ашота",
        "address": "ул. Ленина, д. 1, ТЦ «Центральный»",
        "with_deleted_item": True,
        "description": (
            "Настоящая уличная шаурма по армянскому рецепту. "
            "Готовим только из свежего мяса, лаваш выпекаем сами каждое утро. "
            "Работаем с 2015 года."
        ),
        "is_hiring": True,
        "avg_prep_time_minutes": 7,
        "max_active_orders": 12,
        "items": [
            {
                "name": "Шаурма классик",
                "description": "Говядина, свежие овощи, фирменный соус, лаваш",
                "price": 250,
                "category": Category.SHAURMA,
                "prep_time_minutes": 5,
            },
            {
                "name": "Шаурма с курицей",
                "description": "Куриное филе гриль, помидоры, огурцы, сыр, майонез",
                "price": 280,
                "category": Category.SHAURMA,
                "prep_time_minutes": 5,
            },
            {
                "name": "Шаурма двойная",
                "description": "Двойная порция мяса, два вида соуса",
                "price": 380,
                "category": Category.SHAURMA,
                "prep_time_minutes": 7,
            },
            {
                "name": "Картофель фри",
                "description": "Хрустящий картофель, соль, специи",
                "price": 120,
                "category": Category.SNACK,
                "prep_time_minutes": 7,
            },
            {
                "name": "Coca-Cola 0.5",
                "description": "Газированный напиток",
                "price": 80,
                "category": Category.DRINK,
                "prep_time_minutes": 1,
            },
            {
                "name": "Чай с мятой",
                "description": "Горячий чай с мятой и лимоном",
                "price": 60,
                "category": Category.DRINK,
                "prep_time_minutes": 3,
            },
        ],
        "promos": [
            {
                "code": "SHAUR10",
                "discount_type": "PERCENT",
                "discount_value": 10,
                "max_uses": 100,
            },
            {
                "code": "FIRST50",
                "discount_type": "FIXED",
                "discount_value": 50,
                "max_uses": 50,
            },
        ],
    },
    {
        "vendor_index": 0,
        "name": "Бургерная «Котлета»",
        "address": "пр. Мира, д. 42, 1 этаж",
        "description": (
            "Авторские бургеры с фермерской говядиной. "
            "Котлеты готовятся вручную, булочки печём сами. "
            "Нет ничего лишнего — только мясо, хлеб и вкус."
        ),
        "is_hiring": False,
        "avg_prep_time_minutes": 12,
        "max_active_orders": 18,
        "items": [
            {
                "name": "Чизбургер",
                "description": "Говяжья котлета, чеддер, маринованные огурцы, горчица",
                "price": 320,
                "category": Category.BURGER,
                "prep_time_minutes": 8,
            },
            {
                "name": "Двойной бургер",
                "description": "Две котлеты по 150г, двойной чеддер, соус барбекю",
                "price": 480,
                "category": Category.BURGER,
                "prep_time_minutes": 10,
            },
            {
                "name": "Куриный бургер",
                "description": "Куриное филе, салат, томаты, соус ранч",
                "price": 290,
                "category": Category.BURGER,
                "prep_time_minutes": 8,
            },
            {
                "name": "Картофель фри",
                "description": "Картофель фри с фирменной солью",
                "price": 150,
                "category": Category.SNACK,
                "prep_time_minutes": 7,
            },
            {
                "name": "Луковые кольца",
                "description": "Хрустящие луковые кольца в панировке",
                "price": 140,
                "category": Category.SNACK,
                "prep_time_minutes": 8,
            },
            {
                "name": "Молочный коктейль",
                "description": "Ванильный, шоколадный или клубничный",
                "price": 180,
                "category": Category.DRINK,
                "prep_time_minutes": 3,
            },
            {
                "name": "Лимонад домашний",
                "description": "Лимон, мята, имбирь, сахарный сироп",
                "price": 130,
                "category": Category.DRINK,
                "prep_time_minutes": 2,
            },
        ],
        "promos": [
            {
                "code": "BURGER15",
                "discount_type": "PERCENT",
                "discount_value": 15,
                "max_uses": 200,
            },
        ],
    },
    {
        "vendor_index": 1,
        "name": "Суши-бар «Токио»",
        "address": "ул. Садовая, д. 15, ТРЦ «Галерея»",
        "description": (
            "Японская кухня в центре города. "
            "Роллы готовит шеф-повар с 10-летним опытом работы в Токио. "
            "Рыба доставляется ежедневно, рис — только японский."
        ),
        "is_hiring": True,
        "avg_prep_time_minutes": 20,
        "max_active_orders": 10,
        "items": [
            {
                "name": "Ролл Калифорния",
                "description": "Краб, авокадо, огурец, икра тобико",
                "price": 350,
                "category": Category.SUSHI,
                "prep_time_minutes": 15,
            },
            {
                "name": "Ролл Филадельфия",
                "description": "Лосось, сливочный сыр, огурец",
                "price": 420,
                "category": Category.SUSHI,
                "prep_time_minutes": 15,
            },
            {
                "name": "Ролл Дракон",
                "description": "Угорь, авокадо, огурец, соус унаги",
                "price": 480,
                "category": Category.SUSHI,
                "prep_time_minutes": 18,
            },
            {
                "name": "Нигири с лососем (2 шт)",
                "description": "Рис, свежий лосось, васаби",
                "price": 220,
                "category": Category.SUSHI,
                "prep_time_minutes": 10,
            },
            {
                "name": "Мисо-суп",
                "description": "Паста мисо, тофу, водоросли вакамэ",
                "price": 120,
                "category": Category.OTHER,
                "prep_time_minutes": 5,
            },
            {
                "name": "Зелёный чай",
                "description": "Японский зелёный чай сенча",
                "price": 90,
                "category": Category.DRINK,
                "prep_time_minutes": 2,
            },
            {
                "name": "Рамен с курицей",
                "description": "Бульон тонкоцу, куриное филе, яйцо аджицке, нори",
                "price": 390,
                "category": Category.OTHER,
                "prep_time_minutes": 20,
            },
        ],
        "promos": [
            {
                "code": "SUSHI20",
                "discount_type": "PERCENT",
                "discount_value": 20,
                "max_uses": 50,
            },
            {
                "code": "TOKYO100",
                "discount_type": "FIXED",
                "discount_value": 100,
                "max_uses": 30,
            },
        ],
    },
    {
        "vendor_index": 1,
        "name": "Пиццерия «Napoletano»",
        "address": "ул. Тверская, д. 8",
        "description": (
            "Неаполитанская пицца на дровяной печи. "
            "Тесто выдерживается 48 часов, томаты San Marzano, "
            "моцарелла Fior di Latte. Доставка за 25 минут или пицца бесплатно."
        ),
        "is_hiring": True,
        "avg_prep_time_minutes": 18,
        "max_active_orders": 14,
        "items": [
            {
                "name": "Маргарита",
                "description": "Томатный соус, моцарелла, базилик",
                "price": 450,
                "category": Category.PIZZA,
                "prep_time_minutes": 15,
            },
            {
                "name": "Пепперони",
                "description": "Томатный соус, моцарелла, пепперони",
                "price": 520,
                "category": Category.PIZZA,
                "prep_time_minutes": 15,
            },
            {
                "name": "Четыре сыра",
                "description": "Моцарелла, горгонзола, пармезан, рикотта",
                "price": 580,
                "category": Category.PIZZA,
                "prep_time_minutes": 17,
            },
            {
                "name": "Прошутто",
                "description": "Томатный соус, моцарелла, пармская ветчина, руккола",
                "price": 620,
                "category": Category.PIZZA,
                "prep_time_minutes": 18,
            },
            {
                "name": "Тирамису",
                "description": "Классический итальянский десерт",
                "price": 280,
                "category": Category.OTHER,
                "prep_time_minutes": 5,
            },
            {
                "name": "Апероль шприц б/а",
                "description": "Апельсиновый напиток без алкоголя",
                "price": 160,
                "category": Category.DRINK,
                "prep_time_minutes": 2,
            },
        ],
        "promos": [
            {
                "code": "PIZZA10",
                "discount_type": "PERCENT",
                "discount_value": 10,
                "max_uses": 150,
            },
        ],
    },
]

PAUSED_RESTAURANT_ADDRESS = "ул. Тверская, д. 8"
