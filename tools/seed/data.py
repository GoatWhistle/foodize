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

SEED_USERS: list[dict[str, Any]] = [
    {
        "name": "Алексей Смирнов",
        "first_name": "Алексей",
        "last_name": "Смирнов",
        "middle_name": "Игоревич",
        "email": "admin@foodize.dev",
        "phone_number": "+70000000001",
        "password": "admin1234",
        "role": "admin",
    },
    {
        "name": "Дмитрий Козлов",
        "first_name": "Дмитрий",
        "last_name": "Козлов",
        "middle_name": "Андреевич",
        "email": "vendor1@foodize.dev",
        "phone_number": "+70000000002",
        "password": "vendor1234",
        "role": "vendor",
    },
    {
        "name": "Ирина Новикова",
        "first_name": "Ирина",
        "last_name": "Новикова",
        "middle_name": "Сергеевна",
        "email": "vendor2@foodize.dev",
        "phone_number": "+70000000003",
        "password": "vendor1234",
        "role": "vendor",
    },
    {
        "name": "Артём Петров",
        "first_name": "Артём",
        "last_name": "Петров",
        "middle_name": "Викторович",
        "email": "staff@foodize.dev",
        "phone_number": "+70000000004",
        "password": "staff1234",
        "role": "staff",
    },
    {
        "name": "Мария Соколова",
        "first_name": "Мария",
        "last_name": "Соколова",
        "middle_name": "Олеговна",
        "email": "customer1@foodize.dev",
        "phone_number": "+70000000005",
        "password": "customer1234",
        "role": "customer",
    },
    {
        "name": "Андрей Волков",
        "first_name": "Андрей",
        "last_name": "Волков",
        "middle_name": "Николаевич",
        "email": "customer2@foodize.dev",
        "phone_number": "+70000000006",
        "password": "customer1234",
        "role": "customer",
    },
    {
        "name": "Екатерина Лебедева",
        "first_name": "Екатерина",
        "last_name": "Лебедева",
        "middle_name": "Дмитриевна",
        "email": "customer3@foodize.dev",
        "phone_number": "+70000000007",
        "password": "customer1234",
        "role": "customer",
    },
    {
        "name": "Тестовый Супер",
        "first_name": "Тестовый",
        "last_name": "Супер",
        "middle_name": None,
        "email": "superuser@foodize.dev",
        "phone_number": "+70000000099",
        "password": "super1234",
        "role": "superuser",
    },
]

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

MODERATION_VENDORS: list[dict[str, Any]] = [
    {
        "name": "Пётр Модерский",
        "first_name": "Пётр",
        "last_name": "Модерский",
        "middle_name": "Иванович",
        "email": "vendor_pending@foodize.dev",
        "phone_number": "+70000000010",
        "password": "vendor1234",
        "approval_status": "PENDING",
        "rejection_reason": None,
        "restaurant": {
            "name": "Кофейня «На модерации»",
            "address": "ул. Ожидания, д. 3",
            "description": "Заявка подана, ждём одобрения администратора.",
            "moderation_status": "PENDING",
            "rejection_reason": None,
        },
    },
    {
        "name": "Семён Отказов",
        "first_name": "Семён",
        "last_name": "Отказов",
        "middle_name": "Петрович",
        "email": "vendor_rejected@foodize.dev",
        "phone_number": "+70000000011",
        "password": "vendor1234",
        "approval_status": "REJECTED",
        "rejection_reason": "Не пройдена проверка документов ИП.",
        "restaurant": {
            "name": "Ларёк «Отклонён»",
            "address": "ул. Отказная, д. 7",
            "description": "Заявка отклонена модерацией.",
            "moderation_status": "REJECTED",
            "rejection_reason": "Фото заведения не соответствуют требованиям.",
        },
    },
]

UNAVAILABLE_ITEM_NAMES: set[str] = {"Луковые кольца", "Нигири с лососем (2 шт)"}
DELETED_ITEM: dict[str, Any] = {
    "name": "Сезонный напиток (снят с продажи)",
    "description": "Позиция удалена из меню, но хранится в истории заказов.",
    "price": 199,
    "category": Category.DRINK,
    "prep_time_minutes": 2,
}

PAUSED_RESTAURANT_ADDRESS = "ул. Тверская, д. 8"

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

STAFF_REQUEST_APPLICANTS: list[dict[str, Any]] = [
    {
        "name": "Николай Поваров",
        "first_name": "Николай",
        "last_name": "Поваров",
        "middle_name": "Сергеевич",
        "email": "cook_pending@foodize.dev",
        "phone_number": "+70000000012",
        "password": "cook1234",
        "message": "Опыт работы поваром 3 года, хочу присоединиться.",
        "status": "PENDING",
    },
    {
        "name": "Ольга Кухарёва",
        "first_name": "Ольга",
        "last_name": "Кухарёва",
        "middle_name": "Андреевна",
        "email": "cook_accepted@foodize.dev",
        "phone_number": "+70000000013",
        "password": "cook1234",
        "message": "Готова выйти завтра.",
        "status": "ACCEPTED",
    },
    {
        "name": "Виктор Обжаркин",
        "first_name": "Виктор",
        "last_name": "Обжаркин",
        "middle_name": "Львович",
        "email": "cook_rejected@foodize.dev",
        "phone_number": "+70000000014",
        "password": "cook1234",
        "message": "Ищу подработку на выходные.",
        "status": "REJECTED",
    },
]

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
