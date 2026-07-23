export const apiErrorsByDetail = {
  "Invalid phone number or password": "Неверный телефон или пароль",
  "Invalid credentials": "Неверный телефон или пароль",
  "Not authenticated": "Необходима авторизация",
  "Token has expired": "Сессия истекла, войдите заново",
  "Invalid token": "Недействительный токен авторизации",
  "Token has been invalidated": "Сессия завершена, войдите заново",
  "Account is deactivated": "Аккаунт деактивирован",
  "Refresh token missing": "Необходима авторизация",
  "Refresh token has expired": "Сессия истекла, войдите заново",
  "Invalid refresh token": "Недействительный токен авторизации",
  "Refresh token already used": "Токен уже использован, войдите заново",
  "Access denied": "Доступ запрещён",
  "Bad request": "Некорректный запрос",
  "You have already reviewed this restaurant": "Вы уже оставили отзыв на этот ресторан",
  "You can publish up to 5 reviews for one restaurant":
    "Можно опубликовать до 5 отзывов на один ресторан",
  "Duplicate entry: this information already exists": "Вы уже оставили отзыв на этот ресторан",
  "You can only review restaurants where you have a completed order":
    "Отзыв можно оставить только при наличии завершённого заказа",
  "You already have a pending request for this restaurant.":
    "У вас уже есть активная заявка на этот ресторан",
  "Your previous request was rejected. Please try again after 24 hours.":
    "Ваша предыдущая заявка была отклонена. Повторная подача возможна через 24 часа",
  "You are already a staff member at this restaurant.":
    "Вы уже являетесь сотрудником этого ресторана",
  "You are not a hiring restaurant.": "Этот ресторан не принимает заявки на сотрудников",
  "Staff request not found": "Заявка не найдена",
  "Restaurant is already in favorites": "Ресторан уже добавлен в избранное",
  "Favorite not found": "Запись в избранном не найдена",
  "Order not found": "Заказ не найден",
  "You do not have permission to access this order": "У вас нет доступа к этому заказу",
  "One or more menu items were not found": "Один или несколько товаров не найдены",
  "One or more menu items do not belong to the specified restaurant":
    "Один или несколько товаров не принадлежат этому ресторану",
  "Order can only be cancelled when in PENDING or ACCEPTED status":
    "Отменить заказ можно только пока он ожидает или готовится",
  "Invalid order status transition": "Недопустимое изменение статуса заказа",
  "One or more menu items are not available":
    "Один или несколько товаров недоступны для заказа",
  "Order can only be completed when in READY status":
    "Подтвердить получение можно только в статусе «Готов»",
  "Ready time is required to accept an order": "Укажите время готовности заказа",
  "Idempotency key was used with different payload": "Конфликт запроса, попробуйте ещё раз",
  "Idempotent request is still being processed": "Запрос уже обрабатывается, подождите",
  "Restaurant not found": "Ресторан не найден",
  "Restaurant is currently closed": "Ресторан сейчас закрыт",
  "Restaurant is temporarily not accepting orders":
    "Заведение временно поставило приём заказов на паузу",
  "Duplicate options selected": "Одна и та же опция выбрана дважды",
  "Selected option not found":
    "Одна из выбранных опций больше недоступна. Обновите меню и попробуйте снова",
  "Selected option does not belong to menu item":
    "Одна из выбранных опций не относится к этому блюду",
  "Selected option is not available": "Одна из выбранных опций сейчас недоступна",
  "Not enough options selected": "Выберите обязательные опции блюда",
  "Too many options selected": "Выбрано слишком много опций для блюда",
  "Only one option can be selected": "В этой группе можно выбрать только одну опцию",
  "User already has a vendor profile": "У вас уже есть профиль вендора",
  "User with this phone number already exists":
    "Пользователь с таким номером телефона уже существует",
  "Menu item not found": "Товар не найден",
  "Promo code not found": "Промокод не найден",
  "Promo code is not active or has expired": "Промокод неактивен или истёк",
  "Promo code is not valid for this restaurant":
    "Промокод не действителен для этого ресторана",
  "Promo code usage limit has been reached": "Лимит использования промокода исчерпан",
  "Promo code already exists": "Промокод с таким кодом уже существует",
  "Only VENDOR and STAFF can access orders": "Доступ только для вендоров и сотрудников",
  "Restaurant with this address already exists": "Ресторан с таким адресом уже существует",
  "Password must contain at least one letter": "Пароль должен содержать хотя бы одну букву",
  "Password must contain at least one digit or special character":
    "Пароль должен содержать хотя бы одну цифру или спецсимвол",
  "Only JPEG, PNG or WebP images are supported":
    "Поддерживаются только изображения JPEG, PNG или WebP",
  "File is too large (maximum 5 MB)": "Файл слишком большой (максимум 5 МБ)",
  "Unsupported file type": "Недопустимый тип файла",
  "Empty file": "Пустой файл",
  "Admin access required": "Требуются права администратора",
  "Could not generate unique restaurant display id":
    "Не удалось создать ресторан, попробуйте ещё раз",
  "File not found": "Файл не найден",
  "Insufficient permissions to access vendor profile": "Нет доступа к профилю вендора",
  "Invalid Telegram code": "Неверный код из Telegram",
  "Invalid auth_date": "Данные авторизации Telegram недействительны",
  "Invalid bot secret": "Ошибка авторизации бота",
  "Invalid user payload": "Некорректные данные пользователя",
  "Missing auth_date": "Данные авторизации Telegram неполные",
  "Missing hash": "Данные авторизации Telegram неполные",
  "Missing user id": "Данные авторизации Telegram неполные",
  "Not allowed to assign these permissions": "Недостаточно прав для назначения этих разрешений",
  "Not authorized to manage this restaurant": "У вас нет прав на управление этим рестораном",
  "Notification not found": "Уведомление не найдено",
  "Option group not found": "Группа опций не найдена",
  "Option not found": "Опция не найдена",
  "Password is already set": "Пароль уже установлен",
  "Pickup time is too soon for the current restaurant load":
    "Заведение не успеет приготовить к этому времени. Выберите время позже",
  "Restaurant is closed at requested pickup time":
    "В выбранное время заведение закрыто. Укажите другое время",
  "Restaurant is currently closed (outside working hours)":
    "Заведение сейчас закрыто — нерабочее время",
  "Restaurant with this address or display id already exists":
    "Ресторан с таким адресом уже существует",
  "Review not found": "Отзыв не найден",
  "Session has expired, please log in again": "Сессия истекла, войдите заново",
  "Staff profile not found": "Профиль сотрудника не найден",
  "Too many code requests": "Слишком много запросов кода, попробуйте позже",
  "Too many failed attempts. Try again later.":
    "Слишком много неудачных попыток. Попробуйте позже",
  "User not found": "Пользователь не найден",
  "Vendor account is not approved yet": "Профиль вендора ещё не одобрен",
  "Vendor profile is not approved": "Профиль вендора не одобрен",
  "Vendor profile not found": "Профиль вендора не найден",
  "Wrong password": "Неверный пароль",
  "You don't have permission to manage this request": "У вас нет прав на управление этой заявкой",
  "initData already used": "Данные авторизации уже использованы, откройте приложение заново",
  "initData expired": "Данные авторизации устарели, откройте приложение заново",
  "min_selected cannot be greater than max_selected":
    "Минимальное число опций не может превышать максимальное",
  promo_first_order_only: "Промокод действует только на первый заказ",
  promo_min_order_amount: "Сумма заказа меньше минимальной для этого промокода",
} as const;

export const apiErrorsByStatus = {
  "400": "Некорректный запрос",
  "401": "Необходима авторизация",
  "403": "Доступ запрещён",
  "404": "Ресурс не найден",
  "409": "Конфликт данных",
  "422": "Ошибка валидации данных",
  "429": "Слишком много запросов, попробуйте позже",
  "500": "Внутренняя ошибка сервера",
  "502": "Сервер временно недоступен",
  "503": "Сервис временно недоступен",
} as const;
