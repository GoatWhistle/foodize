from i18n.types import TranslationTree

BOT: TranslationTree = {
    "messages": {
        "welcome": "Добро пожаловать в <b>Foodize</b>!",
        "welcomeRestaurant": (
            "Добро пожаловать в <b>Foodize</b>!\n\nОткрыть заведение <b>{name}</b>:"
        ),
        "welcomeRegistered": (
            "\n\nВаш аккаунт зарегистрирован как <b>{username_hint}</b>.\n"
            "Теперь вы можете войти на сайте через Telegram — просто введите свой @username.\n\n"
            "Также можно привязать номер телефона для обычного входа:"
        ),
        "openApp": "Открыть приложение:",
        "openFoodize": "Открыть Foodize:",
        "openOrder": "Открыть заказ <b>#{display_id}</b>:",
        "miniAppNotConfigured": (
            "Mini App URL пока не настроен. Задайте MINI_APP_URL в .env и в BotFather."
        ),
        "botNotConfigured": (
            "Бот пока не настроен для регистрации: не задан TELEGRAM__BOT_API_SECRET."
        ),
        "botAccessDenied": "Бот не прошел проверку доступа к Foodize API.",
        "apiUnavailable": "Foodize API сейчас недоступен. Попробуйте чуть позже.",
        "phoneLinked": (
            "Готово, телефон привязан к Telegram.\n\n"
            "Теперь можно открыть Foodize и пользоваться сервисом."
        ),
        "phoneLinkFailed": (
            "Не получилось привязать телефон. Проверьте номер и попробуйте еще раз."
        ),
        "sendOwnPhone": "Пожалуйста, отправьте свой номер телефона.",
        "vendorStatusNotConfigured": "Проверка статуса вендора пока не настроена.",
        "vendorStatusError": "Не удалось получить статус. Попробуйте позже.",
        "vendorNotFound": (
            "Вендор-профиль не найден.\n\n"
            "Подайте заявку на сайте Foodize, затем проверьте статус здесь."
        ),
        "vendorApproved": "Ваша заявка вендора одобрена. Кабинет доступен на сайте Foodize.",
        "vendorRejected": "Заявка вендора отклонена.{suffix}",
        "vendorPending": (
            "Заявка вендора на рассмотрении. Мы сообщим, когда администратор примет решение."
        ),
        "vendorRejectionReason": "\n\nПричина: {reason}",
        "ordersNotConfigured": "Просмотр заказов пока не настроен.",
        "ordersError": "Не удалось получить заказы. Попробуйте позже.",
        "noActiveOrders": "Активных заказов сейчас нет.",
        "activeOrdersHeader": "Ваши активные заказы:",
        "noUsername": "без username",
    },
    "buttons": {
        "restart": "Перезапустить бота",
        "openFoodize": "Открыть Foodize",
        "openOrder": "Открыть заказ",
        "openRestaurant": "Открыть ресторан",
        "openNamedRestaurant": "Открыть {name}",
        "sharePhone": "Поделиться телефоном",
    },
    "orderStatus": {
        "PENDING": "Ожидает подтверждения",
        "ACCEPTED": "Принят рестораном",
        "COOKING": "Готовится",
        "READY": "Готов к выдаче",
        "COMPLETED": "Выполнен",
        "CANCELLED": "Отменён",
    },
    "notifications": {
        "orderPlaced": (
            "Заказ{order_ref} в <b>{restaurant}</b> принят!\n\n"
            "Позиций: {items_count}\n"
            "Сумма: {total}\n\n"
            "Мы уведомим вас, когда статус изменится."
        ),
        "orderStatusChanged": (
            "Обновление заказа{order_ref} в <b>{restaurant}</b>\n\n"
            "Статус: <b>{status}</b>\n"
            "Сумма: {total}"
        ),
    },
    "fallback": {
        "restaurant": "ресторан",
    },
}
