WELCOME = "Добро пожаловать в <b>Foodize</b>!"
WELCOME_RESTAURANT = "Добро пожаловать в <b>Foodize</b>!\n\nОткрыть заведение <b>{name}</b>:"
WELCOME_REGISTERED = (
    "\n\nВаш аккаунт зарегистрирован как <b>{username_hint}</b>.\n"
    "Теперь вы можете войти на сайте через Telegram — просто введите свой @username.\n\n"
    "Также можно привязать номер телефона для обычного входа:"
)
OPEN_APP = "Открыть приложение:"
OPEN_FOODIZE = "Открыть Foodize:"
OPEN_ORDER = "Открыть заказ <b>#{display_id}</b>:"
MINI_APP_NOT_CONFIGURED = (
    "Mini App URL пока не настроен. Задайте MINI_APP_URL в .env и в BotFather."
)

BOT_NOT_CONFIGURED = "Бот пока не настроен для регистрации: не задан TELEGRAM__BOT_API_SECRET."
BOT_ACCESS_DENIED = "Бот не прошел проверку доступа к Foodize API."
API_UNAVAILABLE = "Foodize API сейчас недоступен. Попробуйте чуть позже."

PHONE_LINKED = (
    "Готово, телефон привязан к Telegram.\n\nТеперь можно открыть Foodize и пользоваться сервисом."
)
PHONE_LINK_FAILED = "Не получилось привязать телефон. Проверьте номер и попробуйте еще раз."
SEND_OWN_PHONE = "Пожалуйста, отправьте свой номер телефона."

VENDOR_STATUS_NOT_CONFIGURED = "Проверка статуса вендора пока не настроена."
VENDOR_STATUS_ERROR = "Не удалось получить статус. Попробуйте позже."
VENDOR_NOT_FOUND = (
    "Вендор-профиль не найден.\n\n" "Подайте заявку на сайте Foodize, затем проверьте статус здесь."
)
VENDOR_APPROVED = "Ваша заявка вендора одобрена. Кабинет доступен на сайте Foodize."
VENDOR_REJECTED = "Заявка вендора отклонена.{suffix}"
VENDOR_PENDING = "Заявка вендора на рассмотрении. Мы сообщим, когда администратор примет решение."

ORDERS_NOT_CONFIGURED = "Просмотр заказов пока не настроен."
ORDERS_ERROR = "Не удалось получить заказы. Попробуйте позже."
NO_ACTIVE_ORDERS = "Активных заказов сейчас нет."
ACTIVE_ORDERS_HEADER = "Ваши активные заказы:"
