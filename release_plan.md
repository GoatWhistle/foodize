# Foodize — план задач для релиза

> Анализ выполнен 2026-05-16. Охвачены: backend, frontend, telegram-miniapp, telegram-bot, все README.  
> S3 / загрузка фото исключены по требованию.

> **Важное архитектурное ограничение:** Telegram Miniapp предназначена **только** для покупателей. Кабинетов вендора, сотрудника и администратора в миниаппке нет и не должно быть — они существуют исключительно на сайте (frontend). Все задачи, относящиеся к этим ролям, касаются только сайта и бота.

---

## Резюме состояния проекта

**Что реально работает:**
- Backend: REST API, все ключевые endpoints, order state machine с переходами и event log, idempotency keys, outbox для событий, WebSocket статусов заказов и ресторанных событий, notifications WS, Telegram initData auth, promos с min_order_amount / first_order_only / menu_category, рабочие часы, reviews с verified purchase, admin CRUD полный (включая batch-actions, export CSV/PDF, audit log), vendor finance + analytics, staff kanban + stop-list.
- Frontend: все страницы есть (home, auth, restaurant, orders, order status, vendor dashboard, staff dashboard, admin dashboard, profile, favorites, display board). Vendor/admin dashboards — крупные файлы (~2900 и ~3500 строк), функциональны.
- Miniapp: все страницы (home, restaurant, orders, order status, profile, favorites, notifications), Telegram boot flow, notifications store с WS.
- Bot: /start, phone linking, order notifications (order.placed, order.status_changed).

**Что отсутствует / сломано / не готово к релизу:**
Подробно по приоритетам ниже.

---

## P0 — Блокеры релиза (критические проблемы)

### 1. Frontend lint сломан — CI не работает как quality gate

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Исправлены актуальные ESLint-ошибки `no-unused-vars` в `AdminDashboardPage.jsx` и `VendorDashboardPage.jsx`
- Проверено: `npm run lint` проходит в `src/frontend`
- Проверено: `npm run lint` проходит в `src/telegram-miniapp`
- Проверено: `.github/workflows/ci.yml` уже запускает lint как обязательный шаг без `continue-on-error`

**Проблема:** `StaffDashboardPage.jsx` и `VendorDashboardPage.jsx` содержат lint-ошибки (useEffect с missing deps, console.log, etc.). CI падает на lint-шаге, что делает его бесполезным как гарантию качества.

**Что сделать:**
- Починить все ESLint-ошибки в `StaffDashboardPage.jsx` и `VendorDashboardPage.jsx`
- Убедиться, что `npm run lint` проходит без ошибок в обоих проектах (frontend + miniapp)
- В CI сделать lint обязательным gate (не `continue-on-error`)

---

### 2. WebSocket: нет reconnect/backoff/heartbeat

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `ReliableWebSocket` уже реализован в `src/frontend/src/services/api.js` и `src/telegram-miniapp/src/services/api.js`
- Есть reconnect с exponential backoff `1s → 2s → 4s → max 30s`
- Есть heartbeat `ping/pong`
- Есть состояния `connecting / connected / reconnecting / closed`
- Для miniapp notification WS добавлено пробрасывание `onStatusChange` наружу, чтобы UI видел состояние соединения

**Проблема:** В `OrderStatusPage.jsx` и `StaffDashboardPage.jsx` WebSocket открывается через `createOrderWebSocket` / `createRestaurantOrdersWebSocket`, но при разрыве соединения — fallback только один раз (`onclose -> loadOrder()`). Нет exponential backoff, нет heartbeat, нет стратегии при длительном отключении. На мобильном (Telegram miniapp) это критично.

**Что сделать:**
- В `src/frontend/src/services/api.js` и `src/telegram-miniapp/src/services/api.js` реализовать функцию-обёртку WebSocket с:
  - Автоматическим reconnect с exponential backoff (1s → 2s → 4s → max 30s)
  - Heartbeat ping/pong (уже есть на backend: `{"type": "ping"}` → `{"type": "pong"}`)
  - Отслеживанием состояния `connecting / connected / reconnecting / closed`
  - Fallback polling при терминальных ошибках (WS недоступен > N секунд)
- Применить в OrderStatusPage, VendorDashboardPage (orders), StaffDashboardPage, NotificationStore (miniapp)

---

### 3. Vendor approval flow: вендор может работать без одобрения админа

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: backend уже запрещает `create_restaurant_for_vendor`, если `vendor.approval_status != APPROVED`
- Проверено: `ProfilePage.jsx` больше не редиректит pending-вендора в dashboard, а показывает ожидание одобрения
- Проверено: `VendorDashboardPage.jsx` показывает статус ожидания/отклонения и блокирует создание ресторана до `APPROVED`

**Проблема:** В `ProfilePage.jsx` кнопка "Стать вендором" вызывает `vendorService.createProfile()` и **сразу** редиректит на vendor dashboard. В backend `VendorProfile` имеет `approval_status` (PENDING по умолчанию), но frontend не проверяет этот статус и не блокирует доступ до одобрения. Вендор с PENDING-статусом видит полный dashboard и может создавать рестораны.

**Что сделать:**
- Backend: при `approval_status == PENDING` запрещать создание ресторана (возвращать 403)
- Frontend: в `VendorDashboardPage.jsx` добавить проверку `vendorProfile?.approval_status` и показывать состояние ожидания одобрения (аналогично `ApplicationStatus` у staff)
- ProfilePage: не редиректить на dashboard до получения APPROVED-статуса

---

### 4. Ресторан с PENDING moderation_status виден в публичном списке

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `src/backend/features/restaurants/service.py` в `_apply_restaurant_filters()` фильтрует публичную выдачу по `Restaurant.is_active == True`
- Проверено: тот же фильтр требует `Restaurant.moderation_status == ModerationStatus.APPROVED.value`
- Проверено: фильтр используется и для публичного списка, и для публичной карточки ресторана

**Проблема:** Нужно проверить, что endpoint `GET /api/v1/restaurants/` (публичный список) фильтрует по `moderation_status == APPROVED` и `is_active == True`. Если ресторан создан вендором, но ещё не одобрен — он не должен быть виден покупателям.

**Что сделать:**
- Проверить `restaurants/service.py` → `get_public_restaurants()` на наличие фильтра `moderation_status = "APPROVED"`
- Добавить фильтр если отсутствует + миграцию если нужно

---

### 5. Telegram initData: нет теста на атакующие случаи

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `src/backend/tests/unit/test_telegram_validation.py` покрывает корректный initData, невалидную подпись, просроченный `auth_date`, отсутствующий `hash`, отсутствующий `auth_date`, malformed payload и ошибки `user`
- Проверено: `uv run pytest tests/unit/test_telegram_validation.py` проходит, 12 тестов
- Тесты проверяют нужные исключения: атакующие случаи дают `401` через `InvalidTelegramInitDataException`, malformed случаи дают `400` через `MalformedTelegramInitDataException`

**Проблема:** Telegram initData валидируется на backend (`/telegram/`), но нет тестов с невалидной/просроченной/поддельной подписью. В production это дыра в аутентификации miniapp.

**Что сделать:**
- Добавить unit-тесты в `tests/` для `telegram/service.py`:
  - Невалидная подпись → 401
  - Просроченный timestamp (> 86400s) → 401
  - Отсутствующие поля → 400
  - Корректный initData → 200

---

## P1 — Критично для релиза (без этого продукт неполный)

### 6. Отсутствует vendor approval flow в admin UI

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: admin UI уже содержит vendors-tab с approve/reject и batch approve/reject
- Проверено: `VendorDashboardPage.jsx` показывает статус `approval_status` вендора
- Проверено: список ресторанов вендора показывает бейджи `moderation_status` (`PENDING`, `REJECTED`, approved-состояние)
- Добавлен защищённый backend endpoint `POST /api/v1/telegram/bot/vendor-status`
- Добавлена команда Telegram-бота `/vendor_status`, которая показывает `PENDING / APPROVED / REJECTED` и причину отклонения, если она есть

**Проблема:** В `AdminDashboardPage.jsx` есть таб "vendors" с batch approve/reject. Но нет явного уведомления вендора о решении (только смена статуса). Также нет "vendor onboarding" — пути для нового вендора, который понимает, что происходит.

**Что сделать:**
- Telegram-бот: добавить хендлер `/vendor_status` или уведомление при смене `approval_status` вендора (через audit log или отдельный event)
- Frontend VendorDashboardPage: показывать бейдж статуса ресторана (`moderation_status`) в списке ресторанов вендора с пояснением

---

### 7. Промокоды: frontend не показывает все возможности модели

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: форма создания промокода в `VendorDashboardPage.jsx` уже содержит `first_order_only`, `min_order_amount`, `menu_category`
- Добавлено отображение условий промокода в списке: "только первый заказ", минимальная сумма, категория меню

**Проблема:** Модель `Promo` поддерживает `first_order_only`, `min_order_amount`, `menu_category`. Но форма создания промокода в `VendorDashboardPage.jsx` (строки ~237-244) содержит только: `code`, `discount_type`, `discount_value`, `max_uses`, `expires_at`. Поля `first_order_only`, `min_order_amount`, `menu_category` недоступны из UI.

**Что сделать:**
- В форме создания промокода добавить поля: "Только первый заказ" (checkbox), "Минимальная сумма заказа" (number), "Категория меню" (select)
- При отображении активных промокодов — показывать все применённые условия

---

### 8. RestaurantPage: можно делать заказ из закрытого ресторана

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: frontend `RestaurantPage.jsx` уже показывает баннер закрытого заведения и передаёт `isRestaurantOpen` в карточки/шторку товара
- Добавлена такая же защита в Telegram Miniapp:
  - баннер "Заведение сейчас закрыто и не принимает заказы"
  - `MenuItemCard` блокирует выбор блюд при закрытом ресторане
  - `ProductSheet` не добавляет товар при закрытом ресторане
  - `CartDrawer` не оформляет заказ при закрытом ресторане

**Проблема:** `RestaurantPage.jsx` должен блокировать добавление в корзину и оформление заказа если `restaurant.is_open == false`. Нужно проверить что это сделано визуально (не только backend-валидация).

**Что сделать:**
- Проверить `RestaurantPage.jsx`: кнопки "добавить в корзину" и "оформить заказ" должны быть disabled с понятным сообщением при `!restaurant.is_open`
- Добавить явный баннер "Заведение сейчас закрыто. Рабочие часы: ..."

---

### 9. Miniapp: нет deep link в конкретный ресторан/заказ из бота

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: bot notification handlers уже формируют `?startapp=order_{order_display_id}`
- Проверено: `src/telegram-miniapp/src/App.jsx` читает `start_param` и редиректит на `/orders/:id` или `/restaurant/:id`
- Добавлено сохранение `start_param` для новых пользователей: после регистрации miniapp открывает исходный deep link, а не главную
- Проверено: backend notification events содержат `order_display_id`
- Проверено: публичный ресторан lookup принимает UUID и `display_id`

**Проблема:** Бот отправляет кнопку "Открыть Foodize" (открывает главную miniapp). Но при уведомлении об изменении статуса заказа пользователь должен попасть сразу на страницу этого заказа.

> **Важно:** В качестве идентификатора в deep links всегда использовать `display_id` ресторана (поле уже есть в модели `Restaurant`), а не UUID. Для заказов — `display_id` заказа.

**Что сделать:**
- Bot handlers (`notifications/handlers.py`): передавать `startapp` параметр с display_id
  ```python
  # Для заказа:
  url = f"{bot_config.mini_app_url}?startapp=order_{order_display_id}"
  # Для ресторана:
  url = f"{bot_config.mini_app_url}?startapp=restaurant_{restaurant_display_id}"
  ```
- Miniapp `App.jsx`: при boot читать `tg.initDataUnsafe?.start_param`:
  - `order_XXX` → редирект на `/orders/XXX`
  - `restaurant_YYY` → редирект на `/restaurant/YYY` (где YYY — display_id)
- Backend: убедиться что `notifications/events.py` содержит `display_id` для обоих событий (см. также #26)
- Miniapp `RestaurantPage.jsx`: маршрут `/restaurant/:id` должен принимать как UUID, так и display_id (lookup по display_id уже поддержан в backend)

---

### 10. Уведомления miniapp: WS подключается без retry при ошибке

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `createNotificationWebSocket` в miniapp использует `ReliableWebSocket` с retry/backoff/heartbeat
- Добавлено хранение `connectionStatus` в `useNotificationStore`
- Добавлено обновление уведомлений после восстановления соединения
- Добавлен индикатор проблемы с соединением в `BottomNav` на вкладке профиля, когда WS в `reconnecting` или `closed`

**Проблема:** В `App.jsx` miniapp `connectWs(user.id)` подключает WS для уведомлений. Но `useNotificationStore` не имеет reconnect-логики. При разрыве — уведомления перестают приходить до перезагрузки.

**Что сделать:**
- В `useNotificationStore` / `notificationService` добавить reconnect с backoff (аналогично п.2)
- Показывать пользователю индикатор "нет соединения" в BottomNav badge или отдельном элементе

---

### 11. Нет страницы / состояния для staff-заявки с ACCEPTED status

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `process_staff_request()` при `ACCEPTED` автоматически создаёт `StaffProfile` с `restaurant_id` из заявки
- Сохранено старое поведение для пустой заявки: `process_staff_request(..., None, ...)` возвращает `None`
- Проверено: `uv run pytest tests/unit/services/test_staff_service.py` проходит

**Проблема:** В `StaffDashboardPage.jsx` компонент `ApplicationStatus` показывает три состояния: PENDING, ACCEPTED, REJECTED. При ACCEPTED — сообщение "Обратитесь к менеджеру для завершения оформления". Но пользователь с ACCEPTED-заявкой **не** имеет `StaffProfile` с `restaurant_id` — он находится в промежуточном состоянии. Экран не предлагает никаких действий.

**Что сделать:**
- Уточнить flow: когда вендор нажимает "Одобрить заявку" — backend должен автоматически создавать `StaffProfile` привязанный к ресторану
- Проверить `staff/service.py` → `approve_staff_request` — создаётся ли профиль
- Если нет — добавить: при ACCEPTED → создать StaffProfile с restaurant_id из заявки

---

### 12. Display board: требует аутентификации, но предназначен для публичных экранов

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: маршрут `/display-board/:restaurantId` уже вынесен из `ProtectedRoute`
- Проверено: WebSocket `/ws/restaurants/{restaurant_id}/display-board` отдаёт только номера заказов в статусах `PENDING / ACCEPTED / READY`, без персональных данных
- Проверено: доступ защищён `?token=` и permission `DISPLAY_BOARD_VIEW`

**Проблема:** В `App.jsx` маршрут `/display-board` обёрнут в `<ProtectedRoute>`. Display Board (экран для кухни/зала) должен быть доступен без логина или через специальный PIN-код.

**Что сделать:**
- Убрать `ProtectedRoute` с маршрута `/display-board`
- Добавить защиту через `?token=` параметр (short-lived token) или PIN
- Backend: добавить endpoint для получения display-board данных с ограниченным доступом (только статусы PENDING/ACCEPTED/READY, без персональных данных)

---

### 13. Vendor export: экспорт заказов формирует неверный date_from/date_to

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `VendorDashboardPage.jsx` уже разделяет фильтры на `ordersDateFromFilter` и `ordersDateToFilter`
- Проверено: `fetchVendorOrders` передаёт разные `date_from` / `date_to`
- Проверено: UI содержит два date picker: "С" и "По"

**Проблема:** В `VendorDashboardPage.jsx` функция `fetchVendorOrders` (строка ~583-590) при фильтре по дате передаёт `date_from: ordersDateFilter, date_to: ordersDateFilter` — один и тот же день для обоих. Нет возможности выбрать диапазон. Это не критический баг, но сбивает аналитику.

**Что сделать:**
- Разделить `ordersDateFilter` на `ordersDateFrom` и `ordersDateTo`
- Обновить UI: два date picker "С" и "По"

---

### 14. Отсутствует email-поле в регистрации / profile

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `RegisterPage.jsx` содержит optional email field и отправляет `email: email || null`
- Проверено: `ProfilePage.jsx` показывает email только если он есть
- Проверено: форма редактирования профиля содержит `email`

**Проблема:** В `ProfilePage.jsx` показывается `user?.email`, но в форме редактирования профиля нет поля email. Регистрация тоже не запрашивает email. Для релиза нужно определить — используется email или нет. Если нет — убрать из показа. Если да — добавить в форму.

**Что сделать:**
- Решить: email обязателен? Если да — добавить в `RegisterPage.jsx` и форму редактирования профиля
- Если нет — убрать `user?.email` из `ProfilePage.jsx` (не показывать пустое поле)

---

### 15. Bot: нет обработки ошибки "пользователь заблокировал бота"

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `notifications/handlers.py` импортирует `TelegramForbiddenError`
- Проверено: при `TelegramForbiddenError` удаляется Redis binding `user_tg:{user_id}`
- Проверено: Forbidden логируется отдельно от остальных ошибок отправки

**Проблема:** В `notifications/handlers.py` при `bot.send_message` ловится `Exception` и логируется warning. Но `aiogram` при `Forbidden` (пользователь заблокировал бота) должен деактивировать `telegram_id` в Redis чтобы не делать лишние запросы.

**Что сделать:**
- Импортировать `TelegramForbiddenError` (или `aiogram.exceptions.TelegramForbiddenError`)
- При получении — удалять/обнулять запись `user_tg:{user_id}` в Redis
- Логировать отдельно от других ошибок

---

## P2 — Важно для хорошего UX

### 16. Skeleton-загрузка: часть компонентов показывает спиннер вместо skeleton

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Добавлен `AnalyticsSkeleton` в `AdminDashboardPage.jsx` для загрузки finance/stats-блока
- Добавлены `ListSkeleton` и `AnalyticsSkeleton` в `VendorDashboardPage.jsx`
- Заменены оставшиеся спиннеры в vendor promos, working hours и analytics
- Проверено: в `AdminDashboardPage.jsx` и `VendorDashboardPage.jsx` больше нет прямых `<div className="spinner" />`

**Проблема:** `OrderStatusPage.jsx` имеет красивый skeleton. Но `VendorDashboardPage`, `AdminDashboardPage` — показывают `<div className="spinner"/>` при загрузке таблиц. Опыт мигания контента плохой.

**Что сделать:**
- Добавить skeleton-rows для таблиц в AdminDashboardPage (users, orders, restaurants, vendors, reviews)
- Добавить skeleton для карточек статистики (stats tab)

---

### 17. Miniapp: кнопка "Повторить заказ" ведёт по `restaurant.id` (UUID), а не `display_id`

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- В `OrderResponse` добавлено поле `restaurant_display_id`
- Обновлены generated OpenAPI clients
- Обновлена кнопка "Повторить заказ" в frontend и miniapp: используется `restaurant_display_id || restaurant_id`

**Проблема:** В `OrderStatusPage.jsx` frontend (строка ~567): `navigate(ROUTES.RESTAURANT.replace(':id', currentOrder.restaurant_id))` — использует UUID. Miniapp тоже navigates по `r.id` (строка ~176 home page). Это работает, но URL `restaurant/a3b2c1...` некрасив.

**Что сделать:**
- В `OrderResponse` добавить поле `restaurant_display_id` (уже есть `display_id` у Restaurant)
- Обновить navigate: `restaurant_display_id || restaurant_id`

---

### 18. Vendor: нет валидации при создании ресторана — дублирующийся адрес

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `restaurants/crud.py` ловит `IntegrityError` при create/update и возвращает `409 Conflict`
- Проверено: detail — `Restaurant with this address already exists`
- Проверено: `translateApiError.js` переводит этот случай в понятное сообщение

**Проблема:** `Restaurant.address` имеет `unique=True` на уровне БД. При попытке создать второй ресторан с тем же адресом backend вернёт 500 или 422. Frontend показывает непонятную ошибку.

**Что сделать:**
- Backend: добавить явную проверку уникальности адреса с `409 Conflict` и понятным сообщением
- Frontend: `translateApiError` должен обрабатывать этот случай

---

### 19. Admin audit log: отображается только 4 типа событий

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: audit logging уже есть для create/update/delete/toggle menu item
- Проверено: audit logging уже есть для create/deactivate promo
- Добавлен audit log `FORCE_CANCEL_ORDER` в admin force-cancel flow
- Исправлены frontend labels: `UPDATE_PERMISSIONS`, menu actions, promo actions, `FORCE_CANCEL_ORDER`

**Проблема:** В `AdminDashboardPage.jsx` константа `AUDIT_ACTION_LABELS` содержит только 4 значения: APPROVE_VENDOR, REJECT_VENDOR, APPROVE_RESTAURANT, REJECT_RESTAURANT. Но в backend `audit_service.log_action` вызывается только для этих 4 действий. Изменения меню, промокодов, статусов заказов — не логируются.

**Что сделать:**
- Добавить audit logging для:
  - Создание/изменение/удаление menu item (в `menu/api.py`)
  - Создание/деактивация промокода (в `promos/api.py`)
  - Форс-отмена заказа администратором (уже есть `force_cancel_order`, добавить log)
  - Изменение permissions пользователя (в `admin/api.py` → `change_user_permissions`)
- Расширить `AUDIT_ACTION_LABELS` в frontend

---

### 20. Telegram-бот: нет команды /orders для просмотра активных заказов

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Добавлен защищённый backend endpoint `POST /api/v1/telegram/bot/orders`
- Добавлена команда бота `/orders`
- Бот показывает последние 3 активных заказа (`PENDING / ACCEPTED / READY`) и кнопки deep link в miniapp
- Обновлены OpenAPI schema и generated clients

**Проблема:** Бот умеет только: `/start`, share phone, открыть miniapp. Нет inline-команд для просмотра заказов прямо в боте.

**Что сделать:**
- Добавить хендлер `/orders` в `handlers/`:
  - Запрашивает у backend активные заказы пользователя (через bot API secret или Telegram ID lookup)
  - Отображает последние 3 заказа с кнопками перехода в miniapp
- Добавить регистрацию команды в `main.py`

---

### 21. Miniapp profile: нет возможности выйти из аккаунта (разлинковать Telegram)

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `src/telegram-miniapp/src/pages/profile/ProfilePage.jsx` содержит кнопку выхода
- Проверено: `useAuthStore.logout()` вызывает `/telegram/logout`, ставит `foodize_tg_logged_out=1`, очищает sessionStorage и сбрасывает auth state
- Проверено: `App.jsx` читает `foodize_tg_logged_out` и переводит пользователя в flow повторного входа

**Проблема:** В miniapp `ProfilePage` нет кнопки выхода. Есть `localStorage.setItem("foodize_tg_logged_out", "1")` использование в `App.jsx` (строка ~175), то есть механизм logout задуман, но в UI кнопки нет.

**Что сделать:**
- В `ProfilePage.jsx` (miniapp) добавить кнопку "Выйти" или "Сменить аккаунт"
- При нажатии: `localStorage.setItem("foodize_tg_logged_out", "1")` + `window.location.reload()`
- Показывать сообщение что для входа нужно заново открыть miniapp через бота

---

### 22. Miniapp: навигация в RestaurantPage использует UUID, а не display_id

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `HomePage.jsx` miniapp использует `navigate(\`/restaurant/${r.display_id || r.id}\`)`
- Проверено: Favorites miniapp также использует `display_id || id`

**Проблема:** `HomePage.jsx` miniapp (строка ~176): `navigate("/restaurant/${r.id}", ...)` — использует UUID. В frontend-версии аналогичная строка уже обновлена на `display_id || id`. В miniapp — нет.

**Что сделать:**
- Заменить на `navigate("/restaurant/${r.display_id || r.id}", ...)`

---

### 23. Нет rate-limiting на endpoint регистрации в miniapp/Telegram

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `POST /api/v1/telegram/bot/link-phone` ограничен Redis-key `rl:link_phone:{telegram_id}` до 5 запросов в час
- Добавлено warning-логирование превышения лимита по `telegram_id`

**Проблема:** `POST /api/v1/telegram/bot/link-phone` и `POST /api/v1/register` используют `@limiter.limit("10/minute")`. Но Telegram bot-токен позволяет отправлять массовые запросы с разных аккаунтов. Нужна дополнительная защита.

**Что сделать:**
- Добавить rate limit на `link-phone` по `telegram_id` (не только по IP): `5/hour` per telegram_id
- Логировать подозрительные попытки

---

### 24. Vendor: display_id ресторана и QR-код в vendor dashboard

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `VendorDashboardPage.jsx` показывает `display_id` badge в списке и header выбранного ресторана
- Исправлен `QRCodeModal`: site QR теперь ведёт на `/restaurant/{display_id}`, не на UUID и не на неверный `/restaurants/...`
- Добавлен режим Telegram QR: `https://t.me/{VITE_BOT_USERNAME}?start=restaurant_{display_id}`
- Добавлены отдельные кнопки "QR для сайта" и "QR для Telegram" в vendor/admin dashboard
- В `QRCodeModal` добавлен переключатель `Сайт / Telegram`
- Проверено: bot `handlers/start.py` уже обрабатывает `/start restaurant_{display_id}` и отдаёт кнопку на конкретный ресторан

**Проблема:** `QRCodeModal` существует и используется в `VendorDashboardPage.jsx` и `AdminDashboardPage.jsx`. Но нужно:
1. Показывать `display_id` ресторана как badge рядом с названием
2. QR-код для сайта (уже есть) — проверить что ведёт на `/{display_id}`
3. **(Новое)** QR-код для Telegram — отдельная кнопка, генерирует QR с ботовой ссылкой вида `https://t.me/{BOT_USERNAME}?start=restaurant_{display_id}`, при сканировании пользователь попадает в бота → бот открывает miniapp с deep link на конкретный ресторан

**Что сделать:**
- `VendorDashboardPage.jsx`: добавить `display_id` badge в header ресторана
- Проверить что существующий QR ведёт на `/{display_id}`, а не на UUID
- Добавить кнопку "QR для Telegram" рядом с текущей QR-кнопкой
- `QRCodeModal.jsx` (или новый компонент): принять prop `type: 'site' | 'telegram'`, генерировать соответствующий URL
- Telegram URL формат: `https://t.me/{BOT_USERNAME}?start=restaurant_{display_id}`
- Bot `handlers/start.py`: обрабатывать `start_param = restaurant_{display_id}` → отправить кнопку "Открыть ресторан" с WebApp deep link
- `AdminDashboardPage.jsx`: аналогичная кнопка "QR для Telegram" в карточке ресторана

---

### 25. Frontend: ProductPage (RestaurantPage) не показывает рабочие часы публично

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: публичный `GET /api/v1/restaurants/{id}/working-hours` существует
- Проверено: `RestaurantPage.jsx` на сайте показывает рабочие часы в info modal
- Проверено: miniapp `RestaurantPage.jsx` показывает рабочие часы в info modal
- Исправлено отображение дней недели для `day_of_week` в формате `0..6` и `1..7`

**Проблема:** Вендор может задать рабочие часы, backend хранит `WorkingHours`. Но на публичной странице ресторана (`RestaurantPage.jsx`) рабочие часы не отображаются покупателю. Это важная информация для pre-order.

**Что сделать:**
- `GET /api/v1/restaurants/{id}/working-hours` — добавить в публичный доступ (без auth) если ещё нет
- В `RestaurantPage.jsx` добавить блок "Режим работы" с днями недели и временем
- В miniapp `RestaurantPage.jsx` — аналогично

---

### 26. Уведомления: бот не отправляет display_id заказа

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `OrderPlacedEvent` и `OrderStatusChangedEvent` содержат `order_display_id`
- Проверено: `orders/services/order.py` передаёт `str(order.display_id)` во все order notification events
- Проверено: bot notification text включает `#display_id`
- Проверено: bot notification button ведёт в miniapp deep link `?startapp=order_{display_id}`

**Проблема:** В `handle_order_placed` и `handle_order_status_changed` (bot handlers) текст сообщения не содержит номер заказа. Пользователь не знает, о каком заказе идёт речь если их несколько.

**Что сделать:**
- В `OrderPlacedEvent` и `OrderStatusChangedEvent` (backend `notifications/events.py`) добавить поле `display_id`
- Обновить bot handlers: включить `#display_id` в текст уведомления
- Обновить OpenAPI и generated clients

---

## P3 — Желательно до релиза

### 27. CI: OpenAPI contract check не встроен в pipeline

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `.github/workflows/ci.yml` содержит job `openapi-contract-ci`
- Проверено: job запускает `make openapi`
- Проверено: job проверяет diff по `openapi/foodize.openapi.json`, frontend generated client и miniapp generated client

**Проблема:** `make openapi` генерирует clients, но CI не проверяет что они актуальны. Если backend изменился без regeneration — frontend молча работает со старым контрактом.

**Что сделать:**
- В `.github/workflows/ci.yml` добавить шаг:
  ```yaml
  - run: make openapi
  - run: git diff --exit-code -- openapi/foodize.openapi.json src/frontend/src/services/generated src/telegram-miniapp/src/services/generated
  ```

---

### 28. Alembic: нет проверки миграций в CI

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: backend CI запускает `uv run alembic upgrade head`
- Проверено: backend CI запускает `uv run alembic check`

**Что сделать:**
- Добавить в CI: `alembic check` (проверка что нет unpplied миграций) + `alembic upgrade head` на чистой БД

---

### 29. Нет retry/dead-letter для RabbitMQ consumer в боте

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `telegram-bot/notifications/consumer.py` объявляет `foodize.dlx`
- Проверено: для очередей задаются `x-dead-letter-exchange` и `x-dead-letter-routing-key`
- Проверено: обработка делает retry до 3 попыток через `x-retry-count`, затем отправляет сообщение в DLQ через `reject(requeue=False)`
- Логирование consumer lag/очередей оставлено на уровне RabbitMQ Management UI; отдельный Prometheus endpoint в боте не добавлялся

**Проблема:** В `bot/notifications/consumer.py` `requeue=False` — при ошибке обработки сообщение теряется. Нет DLQ.

**Что сделать:**
- Настроить `x-dead-letter-exchange` для очередей бота
- При ошибке — requeue с ограничением по количеству попыток (max 3), затем DLQ
- Добавить метрику consumer lag

---

### 30. Нет `.nvmrc` / единой версии Node.js

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Добавлен `.nvmrc` со значением `20`
- `src/frontend/Dockerfile` переведён на `node:20-alpine`
- `src/telegram-miniapp/Dockerfile` переведён на `node:20-alpine`
- Проверено: GitHub Actions уже использует Node.js `20`

**Проблема:** Dockerfile frontend использует одну версию Node, CI — другую. Ошибки типа "works on my machine".

**Что сделать:**
- Создать `.nvmrc` в корне: `20`
- Синхронизировать Dockerfile и GitHub Actions matrix

---

### 31. Backup/restore PostgreSQL не документирован

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Проверено: `Makefile` уже содержит `make backup` и `make restore FILE=...`
- Проверено: `tools/backup.sh` и `tools/restore.sh` существуют
- Проверено: `README.md` содержит раздел `Backup & Restore`

**Что сделать:**
- Добавить в `README.md` раздел "Backup & Restore" с командами `pg_dump` / `pg_restore`
- Добавить в `Makefile`: `make backup` и `make restore`

---

## Сводная таблица по компонентам

| Компонент | P0 | P1 | P2 | P3 |
|---|---|---|---|---|
| Backend | #3, #4, #5 | #6, #11, #12, #15 | #17, #18, #19, #23, #26 | #27, #28, #29 |
| Frontend (сайт) | #1, #2 | #7, #8, #13, #14 | #16, #17, #24, #25, **#32** | #30, #31 |
| Telegram Miniapp | #2, #10 | #9, #21, #22 | #16, #22, #25 | — |
| Telegram Bot | #5 | #15 | #20, #24 (**#32**), #26 | #29 |

> Миниаппка: задачи по кабинету вендора (#6, #7, #8, #12, #13, #24) относятся **только к сайту**. Миниаппка — только для покупателей.

---

## Очерёдность работы

### Неделя 1 (P0 — блокеры):
1. `#1` Починить frontend lint
2. `#2` WebSocket reconnect/backoff (shared util для frontend + miniapp)
3. `#4` Проверить/добавить moderation_status фильтр в публичном списке ресторанов
4. `#5` Тесты Telegram initData валидации
5. `#3` Vendor approval gate (backend 403 + frontend pending state)

### Неделя 2 (P1 — обязательные фичи):
6. `#9` Deep links из бота в конкретный заказ/ресторан
7. `#7` Полная форма промокода (first_order_only, min_order_amount)
8. `#8` Блокировка заказа из закрытого ресторана + рабочие часы на странице
9. `#11` Staff approval → auto-create StaffProfile
10. `#15` Bot: обработка Telegram Forbidden
11. `#26` display_id в уведомлениях бота
12. `#13` Разделить date_from / date_to фильтры заказов у вендора

### Неделя 3 (P2 — UX polish):
13. `#10` NotificationStore reconnect в miniapp
14. `#21` Logout в miniapp profile
15. `#22` display_id в navigate (miniapp home)
16. `#25` Рабочие часы на публичной странице ресторана
17. `#19` Расширить audit log
18. `#20` /orders команда в боте
19. `#16` Skeleton-загрузка в admin/vendor dashboard

### Финальная неделя (P3 + подготовка к prod):
20. `#27` CI OpenAPI contract check
21. `#28` Alembic CI check
22. `#29` DLQ для RabbitMQ в боте
23. `#30` .nvmrc единая Node версия
24. `#31` Backup/restore документация
25. `#24` display_id badge + QR для Telegram в vendor/admin dashboard
26. `#32` Bot start handler для `restaurant_{display_id}` deep link

---

## Задача #32 (P2) — Telegram QR в vendor/admin кабинетах

**Статус 2026-05-17:** ✅ Выполнено.

**Что сделано:**
- Добавлена отдельная кнопка "QR для Telegram" в vendor dashboard
- Добавлена отдельная кнопка "QR для Telegram" в admin dashboard
- `QRCodeModal.jsx` умеет режимы `Сайт / Telegram`
- Telegram QR строится как `https://t.me/{VITE_BOT_USERNAME}?start=restaurant_{display_id}`
- Проверено: bot `/start restaurant_{display_id}` уже получает ресторан по публичному endpoint и отправляет WebApp кнопку на ресторан

**Контекст:** Вендор/администратор должен иметь возможность распечатать/показать QR-код на Telegram бота, при сканировании которого покупатель попадает в бота, а бот открывает miniapp сразу на странице конкретного ресторана.

**Полный flow:**
1. Вендор нажимает "QR для Telegram" в dashboard
2. Генерируется QR с URL: `https://t.me/{BOT_USERNAME}?start=restaurant_{display_id}`
3. Покупатель сканирует → Telegram открывает бота → бот получает `/start restaurant_{display_id}`
4. Bot `start.py` обрабатывает параметр → отправляет кнопку "Открыть {restaurant_name}" с `WebAppInfo(url=f"{mini_app_url}/restaurant/{display_id}")`
5. Miniapp открывается на странице нужного ресторана

**Что сделать:**
- Frontend: добавить кнопку "QR для Telegram" (отдельно от существующего QR на сайт) в `VendorDashboardPage.jsx` и `AdminDashboardPage.jsx`
- `QRCodeModal.jsx`: добавить переключатель `Сайт / Telegram` с соответствующими URL
- Bot `handlers/start.py`: распарсить `start_param` вида `restaurant_{display_id}`, найти ресторан по display_id через API-запрос, отправить inline-кнопку с WebApp URL
- Backend: добавить публичный endpoint `GET /api/v1/restaurants/by-display/{display_id}` (только name + display_id) для бота (или использовать существующий)

---

## Не включено (по требованию)
- S3 и загрузка фотографий
