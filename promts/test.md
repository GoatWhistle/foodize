# Аудит тестов Foodize

Дата: 2026-07-11. Аудит трёх кодовых баз (backend pytest, frontend Vitest, telegram-bot pytest). Baseline снят до параллельной правки `export/__init__.py` (см. блокер ниже).

## Сводка

| Часть | Файлов | Тестов | Прогон | Покрытие |
|---|---|---|---|---|
| Backend | 110 | 917 | 15 failed, 898 passed, 2 skipped (+ suite виснет намертво) | 84.5% TOTAL (omit прячет бизнес-логику) |
| Frontend | 53 | 314 | всё зелёное, но есть ложнопроходящие | 55% stmts / 72% branch |
| Telegram-miniapp | 11 | 67 | всё зелёное | 85% |
| Telegram-bot | 10 | 57 | всё зелёное | 95% |

---

## БЛОКЕРЫ (чинить в первую очередь)

### B1. Backend suite не завершается локально (зависание)
`tests/unit/api/test_ws_endpoints_display_board.py::test_no_token_sends_not_authenticated` (и весь файл, и `test_ws_endpoints_order_status.py`) виснет навсегда (exit 124).
Причина: тест мокает внутренний `_authenticate_ws_user` → мок не отправляет фрейм `{"error": "not_authenticated"}` (его шлёт реальная функция), а `ws.receive_json()` без таймаута ждёт вечно.
`pytest-timeout` НЕ установлен → зависание фатально для всего прогона.
Фикс: не мокать `_authenticate_ws_user` (мокать `resolve_ws_token_user_id`/redis) либо задать таймаут приёма; добавить `pytest-timeout` + `timeout = 30` в ini.

### B2. Параллельная правка репозитория ломает импорт
На момент завершения аудита `features/admin/export/__init__.py:3` импортирует `_make_csv`, переименованный в `_make_csv_async` в `csv_exports.py` (20:12) → **любой свежий запуск тестов упадёт на ImportError**. Репозиторий правится другим процессом. Baseline снят до этой правки. (По решению пользователя src сейчас не трогаем.)

### B3. Тестовое окружение медленное
Дефолтный redis host `"redis"` (`settings/config/infra/redis.py:5`) не резолвится локально → интеграционные тесты ползут по 1-4 с/тест, полный прогон 15+ мин.
Обход: `HOST=127.0.0.1` + autouse-фикстура, подменяющая `get_redis_cache`; убрать реальный bcrypt из API-тестов (подменять cost/функцию) → суита ускоряется до ~4 мин.

---

## BACKEND

### Карта тестов (917 функций, 110 файлов)
Слои: unit (AsyncMock-сессии), integration (api — httpx.AsyncClient+ASGITransport; services — прямые вызовы на AsyncMock), db (реальная aiosqlite in-memory).

| Путь | Тестов | Слой |
|---|---|---|
| tests/db/ (12 файлов) | 44 | db |
| tests/integration/api/ (11 файлов) | 92 | integration |
| tests/integration/services/ (9 файлов) | 67 | integration |
| tests/unit/ai/ | 30 | unit |
| tests/unit/api/ | 35 | unit |
| tests/unit/crud/ (11 файлов) | 122 | unit |
| tests/unit/dependencies/ | 35 | unit |
| tests/unit/infra/ | 41 | unit |
| tests/unit/security/ (jwt/telegram/permissions) | 46 | unit |
| tests/unit/services/ (37 файлов) | 311 | unit |
| tests/unit/shared/ | 94 | unit |

### Baseline
15 failed, 898 passed, 2 skipped за 229.6s (с исключёнными ws-файлами); покрытие TOTAL 84.50% (fail_under=80 пройден).
- 2 skipped: `tests/db/test_order_idempotency_e2e.py` (требуют Postgres ON CONFLICT).
- Худшие модули (<50%): `admin/export/pdf_base.py` 18%, `orders/api/ws_helpers.py` 25%, `menu/services/options.py` 36%, `infra/llm/embeddings.py` 39%, `ai_order_agent/crud.py` 40%, `admin/crud/advanced_analytics.py` 41%, `menu/services/menu_items.py` 44%, `media/api.py` 47%, `infra/llm/openai_compatible.py` 47%, `ai_order_agent/service.py` 48%.

### Детерминированно красные (3)
- `test_orders_service_create.py::test_place_order_success` и `test_orders_service_options.py::test_selected_options_*`: `AttributeError: 'coroutine' object has no attribute 'all'`. Патчат `order_queries.estimate_restaurant_load`, но `order_placement` держит собственную ссылку (импорт по имени) + не патчат `start_idempotency_record`. Фикс: патчить `order_placement.estimate_restaurant_load` / `order_placement.start_idempotency_record`.
- `test_restaurants_crud.py::test_get_restaurant_by_id`: сломанный мок (scalar-цепочка возвращает coroutine), `assert result == coroutine`.

### Порядко-зависимые падения (12)
`test_notifications_handlers.py` (5), `test_notifications_consumer.py` (5), `test_notifications_outbox.py` (1), `test_notifications_crud.py` (1): standalone проходят, в полном прогоне падают.
Причина: `tests/unit/infra/test_logging_setup.py` вызывает реальный `structlog.configure`/sentry init → ломает `caplog` в тестах, идущих позже. Фикс: `structlog.reset_defaults()` / teardown-fixture.

### Нарушения качества
1. **ws-тесты — блокирующий receive_json без таймаута** — `test_ws_endpoints_display_board.py:43-60`, `test_ws_endpoints_order_status.py`. См. B1.
2. **Хрупкие patch-цели order** — `test_orders_service_create.py:67` (`order_queries.*` вместо `order_placement.*`), то же в `test_orders_service_options.py`.
3. **Сломанный мок** — `test_restaurants_crud.py:40` (scalar-цепочка → coroutine).
4. **Загрязнение глобального logging** — `test_logging_setup.py` (реальный `structlog.configure`).
5. **Тестирование реализации** — `test_middlewares_cache.py:22-90` (приватные `_DEFAULT_CACHEABLE_PATHS`/`_MUTATING_METHODS`, `_make_cache_key`/`_is_cacheable`). Переписать через поведение middleware (запрос → hit/miss).
6. **Сверххрупкий patch** — `test_auth_service_tokens.py:29-34,45-50` (`OAuth2PasswordBearerWithCookie.__bases__[0].__call__`); тесты приватной `_get_bearer_token` (:60-78). Тестировать через `scheme(request)` с реальными заголовками.
7. **Мок SQLAlchemy-примитива** — `test_shared_crud.py:21,37,53` (patch `shared.crud.select`) — тест реализации, функция покрыта db-слоем.
8. **Тесты делегирования** — `test_jwt_utils.py:50-66,110-125` (`test_encode_calls_jwt_encode`, delegation `_create_jwt_token`). Мок PyJWT не нужен — encode/decode детерминированы.
9. **Патчинг `OrderResponse.model_validate`** (собственная схема) — `test_order_status.py:81,124,163,195,216`; `test_order_placement.py:165,214`; `test_order_queries.py:110,144,158,171`; `test_restaurants_service.py:197,217,231`; `test_auth_service_sessions.py:74`; `test_orders_ws.py:153,219`. Скрывает ошибки сериализации → строить полный mock-объект, валидировать реально.
10. **Мок приватных функций своих модулей** — `_notify_user` (`test_notifications_handlers.py:61,71,81,92,107`; `test_notifications_consumer.py:53,74,139,169,195`), `_release_event` (consumer:149,178,201), `_enqueue_feedback_request` (handlers:82,93), `_PDF` (`test_export.py:198,219,243`), `_generate_unique_display_id`+конструктор `Restaurant` (`test_restaurants_crud.py:124,128,157,161`), `_create_order` (`test_orders_service_create.py:72`), `_has_completed_order` (`test_reviews_service.py:50`), `_set_auth_cookies`.
11. **Мок собственной бизнес-логики** — `is_need_staff_for_restaurant` в тестах этого же сервиса (`test_staff_service_requests.py:40,68`); sibling `get_user_by_id` (`test_users_dependencies.py:58,65`); `validate_transition` (`test_order_status.py:176,190,211`); `stream_agent`/`build_advisor_executor` (`test_ai_advisor_service.py:55-57,69-71`).
12. **tests/unit/crud/ системно бесполезны** — 122 теста CRUD против AsyncMock проверяют только «вернул то, что вернул scalar_one_or_none», SQL не проверяется, дублируют tests/db/ без его ценности. `test_orders_crud.py:59` — тавтологичный `assert "status" in str(call_args).lower() or session.execute.called` (всегда истина).
13. **Class-attribute AsyncMock (общий state)** — `test_telegram_site_login.py:32` (`_HttpClient.post`), ручные `reset_mock()` (:49,77).
14. **Дублирование билдеров** — `make_mock_order` в orders_service_helpers.py:32 + продублирован в integration/services/test_orders_status_service.py:15, unit/services/test_order_status.py:24, unit/api/test_ws_endpoints_order_status.py:36, test_order_read_access.py:24; `make_mock_restaurant` ×4; 10-строчные MagicMock-простыни в test_menu_service.py:44-54,80-90,116-139.
15. **Дубль файла** — `test_infra.py` = полный дубль `test_redis_cache.py` (6 тестов 1-в-1) + неинформативное имя.
16. **Дубль export-тестов** — `test_export.py` дублирует `test_admin_export_csv_core.py`/`test_admin_export_csv_entities.py`, причём с `datetime.now()` без tz (:63,77,89,98,109) против фиксированных дат в новых файлах.
17. **Импорты внутри функций** — 55 вхождений (test_promos_service_validate.py:38,50,63,76; test_promos_service_mutations.py:49-203; test_staff_service_requests.py:30,65; test_users_dependencies.py:72; test_order_utils.py:43,148 и др.) — против стандарта проекта.
18. **Несогласованные patch-цели** — `test_menu_service.py:94` (`menu_items.get_restaurant_and_check_ownership`) vs :143,172,194 (`_shared.get_restaurant_and_check_ownership`) — работает случайно.
19. **Тесты без assert / флак по времени** — `test_order_utils.py:147-154` (без assert), :119-143 (реальный `datetime.now()` в is_open_at → флак на границе суток).
20. **Избыточные `@pytest.mark.asyncio`** — почти везде при `asyncio_mode="auto"`.
21. **Докстринги/комментарии** — `tests/unit/ai/*`, `test_telegram_validation.py` — против конвенции «ноль комментариев».
22. **dependency_overrides без try/finally** — `test_orders_api.py:146,155` (в :175-187 finally есть, в :146 нет) — утечка override при падении.

### omit-список coverage (раздут, прячет бизнес-логику)
Исключены при наличии тестов: **`features/orders/crud/order.py`** (unit-тесты есть!), notifications (broker/consumer/handlers/outbox_service/ws/ws_auth), orders/api/ws.py, telegram (_shared/bot_api/crud), admin crud (audit/finance/restaurants/reviews) и api (export/restaurants/vendors), vendors/menu/promos/restaurants/favorites/cart api, worker/, main.py.
Запись `**/features/admin/export.py` устарела (файл заменён пакетом export/).
После честной чистки omit реальное покрытие упадёт ниже 84%.

### Пробелы покрытия (приоритетно: авторизация/деньги/БД)
1. `orders/api/ws_helpers.py` — 25% (авторизация WS-доступа к заказам) + ws.py и notifications/ws*.py в omit → WS-авторизация не измеряется.
2. `telegram/site_login.py` — 62%, `webapp_auth.py` — 67% (вход по коду, криптовалидация initData: rate-limit/повторный код/просроченный nonce).
3. `vendors/dependencies.py` — 67%, `service.py` — 68%, `crud.py` — 72% (проверки владения вендора).
4. `menu/services/options.py` — 36%, `menu_items.py` — 44% (валидация опций, price_delta).
5. `admin/crud/advanced_analytics.py` — 41%, `analytics_shared.py` — 57% (новые модули).
6. `media/api.py` — 47% (S3, безопасность контента); `infra/storage/s3.py` — 56%.
7. `ai_order_agent/crud.py` 40%, `service.py` 48% (агент делает place_order от имени пользователя).
8. Модули из omit — «слепые зоны» под видом 84%: orders/crud/order.py, notifications consumer/handlers/outbox_service, admin/crud/finance.py (деньги!), worker/.
9. `middlewares/limiter.py` — rate limiting как поведение нигде не тестируется.
10. `shared/sanitize.py` — 89%, прямых тестов нет.

---

## FRONTEND (Vitest + RTL)

### Конфиги
- **frontend** (`vite.config.ts`): jsdom, globals, setup `src/__tests__/setup.ts` (jest-dom, mock matchMedia, глобальный `window.confirm = () => true`). Coverage v8, thresholds 50/65/45/50, факт 55/72/48/55 (пороги не защищают).
- **telegram-miniapp**: jsdom, setup только jest-dom. Coverage include только `src/{store,telegram,utils}` + shared — **страницы/компоненты miniapp исключены из coverage вовсе**. Thresholds 78/60/70/78, факт 85/70/80/85.

### Baseline
frontend 314 passed (~53s, 1 act-warning в AdminDashboardPage); miniapp 67 passed. Красных нет, MSW не подключён (известно).

### Ложнопроходящие (проходят, ничего не проверяют) — критично
1. `OrderButton.test.tsx:22` — `expect(container.querySelector('.spinner')).toBeDefined()` проходит и при null.
2. `RestaurantCard.test.tsx:46` — та же ловушка.
3. `App.test.tsx:51-85` — тестируются «симуляторы» (ProtectedRouteSimulator), написанные в самом тесте, а не реальные App/ProtectedRoute.
4. `telegram-miniapp/api.test.ts:14-47,88-106` — `@shared/services/api` замокан, первый describe ассертит поведение собственного мока.
5. `StaffDashboardPage.test.tsx:70-76` — «loading state» ассертит `document.body).toBeDefined()` (всегда true).
6. `StaffDashboardPage.test.tsx:120-129` — все ассерты внутри `if (acceptBtn) {...}`.
7. `StaffDashboardPage.test.tsx:132-146` — «switches to menu tab» вообще без expect.
8. `CartDrawer.test.tsx:113-125` — «error when placeOrder rejects» проверяет только вызов, не UI ошибки.
9. `DisplayBoardPage.test.tsx:99-105` — «error gracefully» ассертит только вызов сервиса.
10. `RestaurantPage.test.tsx:49-69` — дословно продублированный `vi.mock('@shared/store/useRestaurantStore.js')` дважды.

### Селекторы/реализация
11. `RegisterPage.test.tsx:53,120,135` — `querySelector('input[type="checkbox"]')` + `if (checkbox)` → `getByRole('checkbox')`.
12. `OrderDetailsModal.test.tsx:108`, `ShareModal.test.tsx:50` — `querySelector('.modal-overlay')` → роль/aria.
13. `HomePage.test.tsx:142`, `OrderStatusPage.test.tsx:100` — скелетоны по CSS-классам → `role="status"`/aria-busy.
14. `NotificationBell.test.tsx:161` — `closest('div[style]')` — предельно хрупкий.
15. `FoodizeLogo.test.tsx:14,20,26` — querySelector('span') + проверка стилей.
16. `OrderAssistant.test.tsx:80,105,119,133` — `fireEvent.submit(closest('form'))` → user-event click.
17. `HomePage.test.tsx:52-54`, `OrdersPage.test.tsx:46-48` — целиком мокается useHomePageLogic/useOrdersPageLogic → страница как тупой рендерер, хуки не тестируются нигде.

### fireEvent/act
18. Везде кроме LoginPage используется fireEvent (16 файлов) → мигрировать на user-event + await.
19. `AdminDashboardPage.test.tsx` — реальный act()-warning (не дожидается загрузки stats).
20. `RestaurantPage.test.tsx:166-179`, `CartDrawer.test.tsx:96-99,120-123`, `DisplayBoardPage.test.tsx:60-63` — ручные `await act(async () => {...})` костыли вместо `await user.click()` / `findBy*`.

### Сеть/моки
21. Все `__tests__/services/*.test.ts` — `new MockAdapter(api)` без `{ onNoMatch: 'throwException' }` → незамоканные запросы уходят в реальную сеть (localhost:8000).
22. `api.test.ts:38,60,80,101` — захардкожен `http://localhost:8000`.
23. `api.test.ts:21-33,43-54,66-74` — класс MockWebSocket скопирован трижды.

### Прочее
24. Дубли setup: обёртка `render(<BrowserRouter>...)` в каждом page-тесте; `mockImplementation(sel ? sel(state)...)` boilerplate (NotificationBell ×6, LoginPage, OrderStatusPage) — нет `renderWithProviders`/`mockZustandStore`.
25. `AdminDashboardPage.test.tsx:72-80` — девять `as unknown as Awaited<ReturnType<...>>` кастов → typed-хелпер `apiResponse(data)`.
26. `setup.ts:22` — глобальный `window.confirm = () => true` скрывает confirm-ветки.
27. 75 употреблений `toBeDefined()` после getBy*/getAllBy* в 16 файлах → слабый матчер; для queryBy* тихий false-positive → `toBeInTheDocument()`.
28. miniapp `telegram.test.ts` — незаглушенный console-шум `[initTelegramApp] failed`.
29. Непокрытые сценарии: сервисы — только happy-path 200, ни одного 4xx/5xx; CartDrawer — промокод и текст ошибки заказа; RegisterPage — сабмит без чекбокса соглашения; OrderDetailsModal — ошибка getOrderEvents; LoginPage — Telegram-код/username формы.

### Пробелы покрытия
**Приоритет 1 (бизнес-логика без тестов):**
- shared/hooks: `useHomePageLogic`, `useOrdersPageLogic`, `useFavoritesPage`, `useOrderWebSocket` — 0 прямых тестов; `useProfilePage` 57%, `useFocusTrap` 61%.
- shared/services: `menuService` 20%, `promoService` 37%, `staffService` 38%, `reliableWebSocket` 51% (reconnect!), `vendorService` 57%, `orderService` 60%.
- shared/store: `createNotificationStore` 20%, `useRestaurantStore` 54%.
- **telegram-miniapp: ни одного компонентного/страничного теста** — все 10 страниц + BottomNav + ActiveOrderBanner + useTelegramWebApp; вдобавок исключены из coverage-конфига.

**Приоритет 2 (frontend):** vendor-хуки/вкладки (только смоук через VendorDashboardPage); admin-хуки/вкладки; auth-формы (PasswordLoginForm, SetPasswordForm, TelegramCodeForm, TelegramUsernameForm); dashboard/charts (20% stmts, 0% funcs); OrderEtaPicker 1.8%; NotificationsPage/FavoritesPage/SettingsPage.

**Приоритет 3 (shared UI):** Pagination 8.7%, StarRatingInput 8.3%, ReviewsModal 5.1%, ReviewCard 10.9%, InfoModal 12.7%, OrderCard 59%; utils formatReviewTime 7.7%, pluralize 12.5%, wsMessages 22%, restaurant 40%, price 50%, cartLine 51%.

### ТРЕБОВАНИЕ: src/shared/ — минимум 85% покрытия
`src/shared/` — общий код обоих фронтенд-приложений (store, services, hooks, utils, components, pages). Сейчас у него **нет собственного набора тестов** — покрывается только транзитивно из frontend и telegram-miniapp, из-за чего часть модулей проседает (см. Приоритет 1/3 выше: hooks по 0-61%, services 20-60%, store 20-54%, utils/UI 5-51%). Вдобавок miniapp coverage-конфиг **не включает `shared/hooks`** в отчёт → реальный пробел маскируется.

Обязательно:
- Поднять покрытие всех модулей `src/shared/` до **≥85%** (statements/lines), наравне с остальными частями проекта — не оставлять «транзитивно как получится».
- Тестировать shared-модули **напрямую** (renderHook для хуков, изолированные unit для services/utils/store), а не только через страницы, которые их используют.
- Добавить в coverage include обоих приложений весь `src/shared/**` (в miniapp — включая `shared/hooks`, `shared/components`, `shared/pages`), чтобы порог был честным и не обходился exclude-настройками.
- Поднять thresholds до значения, отражающего факт после доработки (целевой минимум 85% по shared-модулям).

---

## TELEGRAM-BOT (pytest + aiogram)

### Карта тестов (10 файлов, 57 тестов, 95% coverage)
| Файл | Тестов |
|---|---|
| test_start_handlers.py | 11 |
| test_notifications_handlers.py | 9 |
| test_start_keyboards.py | 8 |
| test_throttling.py | 6 |
| test_backend_client.py | 5 |
| test_start_backend_calls.py | 5 |
| test_notifications_consumer.py | 5 |
| test_main.py | 4 |
| test_config.py | 2 |
| test_formatting.py | 2 |

### Фикстуры
`conftest.py` (9 строк) — **фикстур нет вообще**, только `os.environ[...]` на импорте. Telegram API мокается примитивно: `AsyncMock()` вместо `Message`, хендлеры вызываются напрямую. **Dispatcher не поднимается ни в одном тесте** → роутинг, `Command()`-фильтры, lambda-фильтры не исполняются. HTTP мокается class-wide `mocker.patch("httpx.AsyncClient.post")`.

### Baseline
57 passed, 0 failed, 6s. Coverage 95% (474 stmts / 24 miss). Слабо: `redis_client.py` 60%, `backend_client.py` 94%, `notifications/handlers.py:84-86` (TelegramRetryAfter).

### Нарушения
- **Мок собственной логики**: `_auto_register` (test_start_handlers.py:15,40,51,137), `cmd_start` (:62), `_link_phone`+голый `assert_called_once()` (:162), `_get_telegram_id`/`_deactivate_telegram_id` (test_notifications_handlers.py:100-101,139-140), `_already_processed`/`_mark_processed` (test_notifications_consumer.py:12-13,28-29).
- **Тестирование реализации**: `test_cmd_start_calls_auto_register` (test_start_handlers.py:135-144, проверяет внутренний вызов); `test_start_notification_consumer` (test_notifications_consumer.py:81-102, verify mock-вызовов aio_pika; :99 проходит случайно из-за `ExchangeType.TOPIC == "topic"`); spy на SimpleRequestHandler kwargs (test_main.py:53-83).
- **Общий mutable state (главная системная проблема)**: прямые мутации синглтона `bot_config` без восстановления — test_start_handlers.py:19-20,43,55,83,89,142; test_start_backend_calls.py:16,28-30,58-60,78-82,115-119; test_start_keyboards.py:13-39; test_notifications_handlers.py:82,85,103,142,179,200 → зависимость от порядка. test_main.py:49,83 — ручной откат `bot_config.mode`. Заменить на `monkeypatch.setattr`.
- **AAA / мульти-сценарий в одном тесте**: test_start_handlers.py:14-35 (success+HTTPError), :148-164 (3 сценария handle_contact); test_start_backend_calls.py:72-105 (6 сценариев cmd_vendor_status), :109-157 (7 сценариев cmd_orders), :25-51 (3 error); test_notifications_handlers.py:99-134,138-171 (по 4 сценария). → parametrize/разбить.
- **Слабые assert/имена**: test_start_handlers.py:35 (после HTTPError только `assert_called_once()`), :57 (`call_count == 2`); test_start_keyboards.py:12-48 (только `isinstance`, ни text ни URL кнопок); test_main.py:28-34 (имя `_logs_exception`, caplog принят, но нет assert по логам); test_start_backend_calls.py:74-75,111-112 (ветка `from_user is None` без assert).
- **sleep/сеть**: не найдено (`asyncio.sleep` корректно замокан).

### Пробелы покрытия
1. **Роутинг/фильтры через Dispatcher (критично)** — ни один тест не делает `dp.feed_update()`; `Command("orders")`, `CommandStart()`, lambda `text == RESTART_TEXT`, `contact is not None` не исполняются.
2. **ThrottlingMiddleware в составе Dispatcher** — только прямой вызов; `_extract_user_id` на реальных типах aiogram не проверен.
3. **Невалидные deep-link** — start.py:196-198 (плохой display_id), 224-226 (order_id не-digit/>10), 219/234 (пустой mini_app_url).
4. **TelegramRetryAfter** — notifications/handlers.py:83-90 (с реальным `asyncio.sleep(e.retry_after)`).
5. **_link_phone без from_user** — start.py:67-68; MINI_APP_NOT_CONFIGURED — start.py:93.
6. **backend_client** — link_phone/get_vendor_status/get_active_orders/register_by_telegram: URL, заголовок `X-Telegram-Bot-Secret`, тело JSON нигде не проверяются.
7. `redis_client.py` (60%) — init/close_client.
8. `config.py:30` — валидатор «webhook без BOT_WEBHOOK_URL».
9. consumer — невалидный JSON в body; `_already_processed`/`_mark_processed` против мока redis.
10. FSM/callback-хендлеров в боте нет (web_app-кнопки, initData валидируется на backend) — не пробел, факт.

### Рекомендации
1. Фикстуры в conftest: фабрика `Message`/`Update` (реальные aiogram-типы через `model_construct`), `Dispatcher` c роутером, мок Telegram-сессии.
2. Интеграционные тесты роутинга через `dp.feed_update()`.
3. Все мутации `bot_config.X` → `monkeypatch.setattr`.
4. Разбить мульти-сценарные тесты на parametrize.
5. Мокать только границы (httpx через respx, redis через fakeredis, aio_pika, Bot.send_message).
6. Class-wide `httpx.AsyncClient.post` → respx/MockTransport с проверкой URL/секрета/тела.
7-10. deep-link валидация, TelegramRetryAfter, keyboard text/url, caplog-assert, убрать лишние `@pytest.mark.asyncio`.
