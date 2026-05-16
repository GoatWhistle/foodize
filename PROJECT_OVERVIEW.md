# Foodize: обзор проекта

Дата обзора: 2026-05-02

## Что это за проект

Foodize - это платформа для предзаказа еды у ресторанов. В проекте есть backend API, веб-фронтенд, Telegram Mini App, Telegram-бот, фоновые уведомления, Docker-инфраструктура, миграции БД, тесты и базовый мониторинг.

Система рассчитана на несколько ролей:

- покупатель: регистрация, вход, просмотр ресторанов и меню, корзина, заказы, избранное, отзывы;
- ресторан/вендор: управление рестораном, меню, заказами, финансами и аналитикой;
- персонал: рабочий кабинет сотрудника ресторана и заявки на роль;
- администратор: управление пользователями, ресторанами, вендорами, отзывами, заказами, финансами и аналитикой;
- Telegram-пользователь: вход и работа через Mini App, уведомления через бота.

## Краткая архитектура

```text
Foodize
├── backend FastAPI
│   ├── REST API /api/v1
│   ├── WebSocket для статуса заказов
│   ├── PostgreSQL через SQLAlchemy async
│   ├── Redis для кеша/инфраструктуры
│   ├── RabbitMQ для событий и уведомлений
│   ├── Alembic миграции
│   └── pytest тесты
├── frontend React/Vite
│   ├── пользовательский веб-интерфейс
│   ├── админ-панель
│   ├── кабинет вендора
│   └── кабинет персонала
├── telegram-miniapp React/Vite
│   ├── мобильный Telegram-интерфейс
│   ├── Telegram WebApp SDK init/auth
│   └── страницы покупателя
├── telegram-bot aiogram
│   ├── /start
│   ├── polling или webhook режим
│   └── прием уведомлений из RabbitMQ
└── docker-compose
    ├── postgres
    ├── redis
    ├── rabbitmq
    ├── migrations
    ├── backend
    ├── worker
    ├── frontend
    ├── telegram-bot
    └── telegram-miniapp
```

## Корень репозитория

| Путь | Назначение |
| --- | --- |
| `README.md` | Сейчас содержит только заголовок `Foodize`; документацию стоит расширить. |
| `PROJECT_OVERVIEW.md` | Этот файл: карта проекта, состав и идеи развития. |
| `LICENSE` | MIT-лицензия. |
| `.env` | Локальные переменные окружения. Секреты нельзя коммитить. |
| `.env.example` | Шаблон переменных окружения для запуска проекта. |
| `.gitignore` | Исключения Git. |
| `.dockerignore` | Исключения для Docker build context. |
| `.pre-commit-config.yaml` | Ruff, Black, mypy, ESLint, Prettier, trailing whitespace/end-of-file checks. |
| `Makefile` | Команды `sync`, `lint`, `test`, `openapi`, `keys`, `build`, `up`, `down`, `stop`, `logs`. |
| `docker-compose.yaml` | Основной compose для разработки и запуска всех сервисов. |
| `docker-compose.monitoring.yml` | Отдельный compose для Prometheus и Grafana. |
| `prometheus.yml` | Конфигурация scrape FastAPI metrics. |
| `.github/workflows/ci.yml` | CI: backend lint/typecheck/tests/coverage и frontend lint/tests/coverage. |
| `Khorokhorin/Desktop/foodize/src/backend/certs` | Похоже на случайно созданный вложенный путь с сертификатами. Стоит проверить и удалить/перенести, если это артефакт. |

## Backend

Путь: `src/backend`

Backend написан на Python 3.13, FastAPI, SQLAlchemy async, Alembic, Pydantic, Redis, RabbitMQ, SlowAPI, structlog и Prometheus instrumentation.

Основные точки:

- `main.py` - создание FastAPI app, middleware, exception handlers, `/api/ping`, `/api/health`, Prometheus metrics.
- `api/v1/__init__.py` - подключение всех роутеров API под префиксом `/api/v1`.
- `settings/` - конфигурация приложения через Pydantic settings: run, DB, Redis, RabbitMQ, CORS, JWT, Telegram.
- `database/` - async DB helper, metadata, base model, mixins `created_at`, `updated_at`, `deleted_at`, `id`.
- `middlewares/` - request id, security headers, rate limit, auto cache.
- `shared/` - общие enum, response schemas, exceptions, role dependencies.
- `infra/cache` - абстракция и Redis-реализация кеша.
- `infra/messaging` - абстракция и RabbitMQ publisher.
- `worker/main.py` - запуск фонового notification consumer.
- `alembic/` - миграции базы, сейчас 25 файлов версий.
- `tests/` - unit, db и integration тесты, сейчас 62 Python test-файла.

### Backend-модули features

| Модуль | Роль |
| --- | --- |
| `admin` | Админские операции: пользователи, роли, рестораны, вендоры, отзывы, заказы, статистика, финансы, аналитика. |
| `auth` | Регистрация, логин, refresh, logout, JWT RS256. |
| `cart` | Корзина пользователя. |
| `favorites` | Избранные рестораны. |
| `menu` | Управление меню, категориями/позициями/опциями. |
| `notifications` | События заказов, публикация и обработка уведомлений через RabbitMQ. |
| `orders` | Создание заказов, позиции заказа, статусы, события, WebSocket `/ws/orders/{order_id}`. |
| `promos` | Промокоды и их валидация. |
| `restaurants` | Рестораны, публичный список, рабочие часы, рейтинги, доступ вендора. |
| `reviews` | Отзывы, рейтинг ресторана, verified purchase. |
| `staff` | Профили персонала, заявки, участники команды ресторана. |
| `telegram` | Проверка, регистрация и авторизация Telegram Mini App пользователя. |
| `users` | Профиль пользователя, смена пароля, чтение пользователя. |
| `vendors` | Профиль вендора, финансы и аналитика. |

### API-поверхность

Основной REST-префикс: `/api/v1`.

Крупные группы endpoint-ов:

- `/register`, `/login`, `/refresh`, `/logout`;
- `/users/...`;
- `/restaurants/...`;
- `/menu/...`;
- `/cart`;
- `/orders/...`;
- `/favorites/...`;
- `/reviews` через `/restaurants/{restaurant_id}/reviews`;
- `/promos/...`;
- `/vendors/...`;
- `/staff/...`;
- `/admin/...`;
- `/telegram/...`;
- WebSocket: `/api/v1/ws/orders/{order_id}`;
- health: `/api/ping`, `/api/health`;
- metrics: Prometheus endpoint, подключенный через `prometheus-fastapi-instrumentator`.

## Frontend

Путь: `src/frontend`

Веб-приложение написано на React 19, Vite, React Router 7, Zustand, Axios, Phosphor Icons и Recharts.

Состав:

- `src/App.jsx` - роутинг, protected routes, инициализация темы, пользователя, корзины и избранного.
- `src/pages/` - страницы:
  - `home/HomePage.jsx`;
  - `auth/LoginPage.jsx`;
  - `auth/RegisterPage.jsx`;
  - `restaurant/RestaurantPage.jsx`;
  - `orders/OrdersPage.jsx`;
  - `orders/OrderStatusPage.jsx`;
  - `profile/ProfilePage.jsx`;
  - `profile/FavoritesPage.jsx`;
  - `vendor/VendorDashboardPage.jsx`;
  - `staff/StaffDashboardPage.jsx`;
  - `admin/AdminDashboardPage.jsx`.
- `src/components/ui/` - UI-компоненты: карточка ресторана, корзина, кнопка заказа, бейдж статуса, пагинация, модалки, empty state, error boundary, theme toggle, logo.
- `src/components/layout/MainLayout.jsx` - основной layout.
- `src/components/dashboard/DashboardCharts.jsx` - графики для dashboard.
- `src/services/` - API-клиенты: auth, user, restaurant, menu, cart, order, favorite, review, promo, staff, vendor, admin.
- `src/store/` - Zustand store: auth, theme, restaurant, order, modal, favorite.
- `src/__tests__/` - Vitest/Testing Library тесты сервисов, store, страниц и компонентов, сейчас 13 JS test-файлов.
- `nginx/default.conf` - nginx-конфиг для production-сборки.
- `Dockerfile` - dev/build/production stages.

## Telegram Mini App

Путь: `src/telegram-miniapp`

Отдельное React/Vite приложение для запуска внутри Telegram WebApp.

Состав:

- `src/App.jsx` - lazy routes, Telegram boot flow, автоматическая авторизация/регистрация через initData, нижняя навигация.
- `src/telegram/sdk.js` и `src/telegram/init.js` - интеграция с Telegram WebApp SDK.
- `src/hooks/useTelegramWebApp.js` - hook для Telegram WebApp.
- `src/pages/` - home, restaurant, orders, order status, profile, favorites, register.
- `src/components/` - BottomNav, CartDrawer и UI-компоненты.
- `src/services/` - API-клиенты, почти зеркально frontend.
- `src/store/` - Zustand store для auth, restaurant, order, favorite.
- `nginx/default.conf` и `Dockerfile` - production/dev упаковка.

## Telegram Bot

Путь: `src/telegram-bot`

Бот написан на aiogram 3.

Состав:

- `main.py` - запуск polling или webhook режима, регистрация роутеров, запуск notification consumer.
- `config.py` - настройки токена, Mini App URL, режима webhook/polling, Redis/RabbitMQ.
- `handlers/start.py` - обработчик старта.
- `notifications/consumer.py` и `notifications/handlers.py` - получение событий из RabbitMQ и отправка уведомлений пользователям.
- `utils/formatting.py` - форматирование сообщений.
- `Dockerfile`, `pyproject.toml`, `uv.lock` - упаковка и зависимости.

## Инфраструктура

Основной `docker-compose.yaml` поднимает:

- `pg` - PostgreSQL 17;
- `rabbitmq` - RabbitMQ 4 с management UI на `15672`;
- `redis` - Redis 7.4;
- `migrations` - Alembic upgrade перед backend;
- `backend` - FastAPI на `8000`;
- `worker` - фоновый consumer уведомлений;
- `frontend` - Vite dev server на `5173`;
- `telegram-bot` - aiogram бот;
- `telegram-miniapp` - Vite dev server на `5174`.

Отдельный `docker-compose.monitoring.yml` поднимает:

- `prometheus` на `9090`;
- `grafana` на `3000`;
- scrape target FastAPI: `host.docker.internal:8000`.

## Команды разработки

Из `Makefile`:

- `make sync` - установка backend, bot, frontend и miniapp зависимостей;
- `make lint` - pre-commit checks для проекта;
- `make test` - backend pytest и frontend vitest;
- `make openapi` - экспорт OpenAPI schema и генерация typed clients для frontend и miniapp;
- `make keys` или `make certs` - генерация RSA ключей JWT в `src/backend/certs`;
- `make build` - сборка Docker сервисов;
- `make up` - запуск Docker сервисов;
- `make down` - остановка и удаление контейнеров;
- `make stop` - остановка контейнеров;
- `make logs` - просмотр логов.

## Что уже хорошо покрыто

- Проект разделен на независимые сервисы: backend, frontend, miniapp, bot, worker.
- Backend имеет модульную структуру `features/*` с разделением `api`, `service`, `crud`, `schemas`, `models`, `exceptions`.
- Есть async SQLAlchemy, Alembic и набор миграций.
- Есть Redis, RabbitMQ, события заказов и фоновые уведомления.
- Есть роли, staff-система, admin dashboard, vendor dashboard.
- Есть тесты backend: unit, db, integration.
- Есть frontend-тесты для сервисов, store, страниц и компонентов.
- Есть CI и pre-commit.
- Есть healthcheck-и и Prometheus/Grafana заготовка.

## Замечания по текущему состоянию

- `README.md` почти пустой. Для командной работы туда нужно вынести быстрый старт, переменные окружения, команды запуска, тесты, миграции и ссылку на архитектурную документацию.
- В `.env.example` и части русских строк/комментариев виден mojibake в PowerShell. Нужно привести файлы к UTF-8 и договориться о кодировке редакторов/CI.
- CI, Dockerfile и локальная разработка используют разные версии Node.js. Лучше зафиксировать одну версию через `.nvmrc`/`.node-version`, Dockerfile и GitHub Actions.
- Основной frontend и Telegram Mini App дублируют API services, store-логику и часть UI. Это увеличивает стоимость изменений: одну бизнес-правку часто нужно делать дважды.
- OpenAPI schema и typed clients уже добавлены как направление, но пока не встроены в CI как contract check. Сейчас это инструмент генерации, а не гарантия от рассинхрона.
- WebSocket-логика статусов заказов есть, но нет явной стратегии reconnect/backoff, heartbeat, дедупликации событий и восстановления состояния после пропущенных сообщений.
- RabbitMQ используется для уведомлений, но для надежной доставки событий заказа нужен outbox/inbox-подход или другой механизм, который связывает запись в БД и публикацию события атомарно.
- Корзина хранится в Redis. Нужно явно определить политику TTL, восстановления, совместимости при изменении схемы menu item/options и поведение при недоступности Redis.
- Нет полноценного audit log для административных, vendor и staff действий. Для взрослого marketplace это критично: кто изменил меню, цену, статус заказа, права или промокод.
- Есть Prometheus/Grafana заготовка, но не видно production-ready dashboard provisioning, алертов и SLO: ошибки API, latency, queue lag, WebSocket disconnects, время обработки заказа.
- Telegram Mini App для production требует публичные HTTPS URL, webhook-mode, проверку подписи initData, понятную стратегию токенов и тесты edge cases.
- Frontend lint сейчас падает на существующих ошибках в staff/vendor dashboard. Это снижает доверие к CI и мешает использовать lint как quality gate.

## Архитектурные проблемы и технический долг

### API contract и типизация

- Ручные `services/*.js` в frontend и miniapp исторически расходятся с backend-контрактом. Нужен обязательный contract workflow: backend экспортирует OpenAPI, фронты генерируют типы/клиент, CI проверяет, что generated files актуальны.
- Сейчас клиенты остаются JavaScript. Следующий взрослый шаг - постепенно переносить service-layer на TypeScript или хотя бы JSDoc-типизацию поверх generated schemas.
- Нужно договориться, что является публичным contract: response envelope, error shape, pagination, auth errors, validation errors. Сейчас это размазано между backend handlers и frontend `translateApiError`.

### Доменные границы

- `features/*` хорошо разделены физически, но доменные инварианты заказа, промокода, меню и уведомлений нужно держать в service-layer, а не размазывать между API, CRUD и frontend.
- Заказ должен иметь строгую state machine: разрешенные переходы, actor, timestamp, reason, side effects. Это важно для отмен, возвратов, staff/vendor workflows и аудита.
- Финансы и промокоды стоит отделить от базовой логики заказа: итоговая цена, скидка, комиссия, refund и история пересчета должны быть воспроизводимыми.

### Надежность событий

- Смена статуса заказа должна создавать durable event в БД и только потом отправляться в RabbitMQ/WebSocket/Telegram. Иначе возможны потерянные уведомления.
- Нужны idempotency keys для создания заказа и оплаты, чтобы повторный клик/ретрай не создавал дубликаты.
- Для consumers нужны retry policy, dead-letter queue, poison-message handling и метрики queue lag.

### Frontend architecture

- Основной frontend и miniapp нуждаются в общем слое: generated API client, доменные mappers, форматирование цен/дат, enum labels, cart/order helpers.
- Большие страницы dashboard стоит разрезать на feature-компоненты и hooks. Сейчас такие файлы легко становятся местом случайных regressions.
- Нужна единая стратегия серверного состояния: сейчас часть данных в Zustand, часть локально в компонентах. Для заказов, меню, профиля и dashboard-таблиц лучше определить правила кеширования, invalidation и optimistic updates.

### Security и production readiness

- Refresh token rotation, session table/blacklist и revoke-device flow нужны до реального production.
- Нужна явная CSRF/CORS модель с учетом cookie/auth header сценариев.
- Нужен secret scanning в CI и запрет на commit `.env`, JWT keys, Telegram tokens, dumps.
- Нужны backup/restore runbooks для PostgreSQL и проверка восстановления, не только наличие volume.

## Что добавить, чтобы проект стал взрослее

### P0: качество, которое должно блокировать regressions

- CI contract check: `make openapi`, генерация клиентов, затем проверка `git diff --exit-code`, чтобы API schema/client не забывали обновлять.
- Починить frontend lint и сделать его обязательным quality gate.
- Playwright smoke-tests для ключевого пути: регистрация/логин, ресторан, добавление в корзину, промокод, заказ, смена статуса, получение заказа.
- Alembic migration check в CI: одна head-миграция, upgrade на пустой БД, downgrade policy или хотя бы documented no-downgrade decision.
- Coverage gates по критичным backend модулям: orders, promos, auth, permissions, Telegram auth.
- Secret scanning и dependency audit для Python/Node.

### P1: надежный заказ как ядро продукта

- Order state machine с таблицей разрешенных переходов, actor и reason.
- Idempotency keys для `create order`, `complete order`, будущей оплаты и повторных webhook callbacks.
- Outbox pattern для order events: БД событие -> publisher -> RabbitMQ/WebSocket/Telegram.
- Durable order timeline: пользователь, ресторан и админ видят историю статусов, отмен, комментариев и системных событий.
- Reconnect/backoff для WebSocket, heartbeat и fallback polling для страницы статуса заказа.
- Явные SLA/ETA поля: estimated ready time, actual ready time, pickup deadline, delay reason.

### P1: операционная зрелость для ресторанов

- Stop-list и быстрый toggle доступности блюд/опций во время смены.
- CRUD рабочих часов и временных закрытий: сегодня закрыто, перерыв, праздник, перегруз кухни.
- New order alert в staff/vendor dashboard: звук/визуальный сигнал, подтверждение принятия, фильтр активных заказов.
- Экспорт заказов и финансов в CSV/XLSX.
- Audit log для изменений меню, цен, промокодов, статусов, прав сотрудников и ресторанных настроек.
- Роли внутри ресторана: owner, manager, cook, cashier с разными правами.

### P1: Telegram production-flow

- Проверка подписи Telegram initData с тестами нормальных и атакующих случаев.
- Deep links в ресторан, menu item и конкретный заказ.
- Telegram notifications по статусам заказа с retry и логированием доставки.
- Webhook production mode для бота: HTTPS/nginx инструкция, secret path/header, healthcheck.
- Обработка случая, когда пользователь удалил чат/заблокировал бота.

### P2: продуктовые фичи, которые усиливают marketplace

- Поиск по ресторанам и блюдам: категория, рейтинг, доступность, время приготовления, открыто сейчас.
- Избранные блюда, а не только рестораны.
- Гибкие промокоды: минимальная сумма, период действия, лимиты, first order only, ресторан/категория/пользователь.
- Отмена заказа с причинами и правилами по времени.
- Чат или быстрые сообщения по заказу: "опоздаю", "заменить блюдо", "нет ингредиента".
- Online payment-ready architecture: payment intent, provider webhook, refund, reconciliation, без обязательной немедленной интеграции.
- Загрузка фотографий в S3-compatible storage with moderation flow.
- Рекомендации на основе истории заказов после накопления данных.

### P2: наблюдаемость и эксплуатация

- Grafana dashboards provisioning: API latency/error rate, DB pool, Redis, RabbitMQ queue lag, order conversion funnel.
- Alert rules: backend 5xx, высокая latency, consumer lag, ошибки Telegram delivery, health degraded.
- Structured logs с request_id/user_id/order_id/restaurant_id и dashboard/search recipe.
- Backup/restore scripts и регулярная проверка восстановления PostgreSQL.
- Production runbooks: как откатить релиз, как восстановить очередь, что делать при падении Redis/RabbitMQ.

### P2: UX и polish

- Skeleton/loading states для ресторанов, меню, заказа и dashboard tables.
- Единая дизайн-система для frontend и miniapp: tokens, buttons, forms, badges, empty/error states.
- Accessibility pass: focus states, keyboard navigation, aria-labels, reduced motion, contrast.
- Mobile-first checkout: sticky cart summary, быстрый повтор заказа, понятные ошибки промокода/опций.
- Admin/vendor dashboards с адаптивными таблицами, фильтрами, сохранением состояния и понятными bulk actions.

## План задач для релиза

> Анализ выполнен 2026-05-16. Охвачены: backend, frontend, telegram-miniapp, telegram-bot, все README.
> S3 / загрузка фото исключены по требованию.

> **Важное архитектурное ограничение:** Telegram Miniapp предназначена **только** для покупателей. Кабинетов вендора, сотрудника и администратора в миниаппке нет и не должно быть — они существуют исключительно на сайте (frontend). Все задачи, относящиеся к этим ролям, касаются только сайта и бота.

---

### Резюме состояния проекта

**Что реально работает:**
- Backend: REST API, все ключевые endpoints, order state machine с переходами и event log, idempotency keys, outbox для событий, WebSocket статусов заказов и ресторанных событий, notifications WS, Telegram initData auth, promos с min_order_amount / first_order_only / menu_category, рабочие часы, reviews с verified purchase, admin CRUD полный (включая batch-actions, export CSV/PDF, audit log), vendor finance + analytics, staff kanban + stop-list.
- Frontend: все страницы есть (home, auth, restaurant, orders, order status, vendor dashboard, staff dashboard, admin dashboard, profile, favorites, display board). Vendor/admin dashboards — крупные файлы (~2900 и ~3500 строк), функциональны.
- Miniapp: все страницы (home, restaurant, orders, order status, profile, favorites, notifications), Telegram boot flow, notifications store с WS.
- Bot: /start, phone linking, order notifications (order.placed, order.status_changed).

**Что отсутствует / сломано / не готово к релизу:**
Подробно по приоритетам ниже.

---

### P0 — Блокеры релиза (критические проблемы)

#### 1. Frontend lint сломан — CI не работает как quality gate

**Проблема:** `StaffDashboardPage.jsx` и `VendorDashboardPage.jsx` содержат lint-ошибки (useEffect с missing deps, console.log, etc.). CI падает на lint-шаге, что делает его бесполезным как гарантию качества.

**Что сделать:**
- Починить все ESLint-ошибки в `StaffDashboardPage.jsx` и `VendorDashboardPage.jsx`
- Убедиться, что `npm run lint` проходит без ошибок в обоих проектах (frontend + miniapp)
- В CI сделать lint обязательным gate (не `continue-on-error`)

---

#### 2. WebSocket: нет reconnect/backoff/heartbeat

**Проблема:** В `OrderStatusPage.jsx` и `StaffDashboardPage.jsx` WebSocket открывается через `createOrderWebSocket` / `createRestaurantOrdersWebSocket`, но при разрыве соединения — fallback только один раз (`onclose -> loadOrder()`). Нет exponential backoff, нет heartbeat, нет стратегии при длительном отключении. На мобильном (Telegram miniapp) это критично.

**Что сделать:**
- ✅ Реализована функция-обёртка WebSocket с автоматическим reconnect и exponential backoff.
- ✅ Применено в OrderStatusPage, VendorDashboardPage, StaffDashboardPage.
- ✅ Поддержан Heartbeat (ping/pong).

---

#### 3. Vendor approval flow: вендор может работать без одобрения админа

**Проблема:** В `ProfilePage.jsx` кнопка "Стать вендором" вызывает `vendorService.createProfile()` и **сразу** редиректит на vendor dashboard. В backend `VendorProfile` имеет `approval_status` (PENDING по умолчанию), но frontend не проверяет этот статус и не блокирует доступ до одобрения. Вендор с PENDING-статусом видит полный dashboard и может создавать рестораны.

**Что сделать:**
- ✅ Backend: при `approval_status == PENDING` запрещено создание ресторана (403).
- ✅ Frontend: в `VendorDashboardPage.jsx` добавлена проверка статуса и блокировка действий до одобрения.
- ✅ ProfilePage: редирект блокируется до получения APPROVED.

---

#### 4. Ресторан с PENDING moderation_status виден в публичном списке

**Проблема:** Нужно проверить, что endpoint `GET /api/v1/restaurants/` (публичный список) фильтрует по `moderation_status == APPROVED` и `is_active == True`. Если ресторан создан вендором, но ещё не одобрен — он не должен быть виден покупателям.

**Что сделать:**
- Проверить `restaurants/service.py` → `get_public_restaurants()` на наличие фильтра `moderation_status = "APPROVED"`
- Добавить фильтр если отсутствует + миграцию если нужно

---

#### 5. Telegram initData: нет теста на атакующие случаи

**Проблема:** Telegram initData валидируется на backend (`/telegram/`), но нет тестов с невалидной/просроченной/поддельной подписью. В production это дыра в аутентификации miniapp.

**Что сделать:**
- ✅ Добавлены unit-тесты для `telegram/service.py` (12 тестов).
- ✅ Реализована дифференциация 400 (malformed) и 401 (invalid/expired).
- ✅ Строгая валидация JSON в `user` поле.

---

### P1 — Критично для релиза (без этого продукт неполный)

#### 6. Отсутствует vendor approval flow в admin UI

**Проблема:** В `AdminDashboardPage.jsx` есть таб "vendors" с batch approve/reject. Но нет явного уведомления вендора о решении (только смена статуса). Также нет "vendor onboarding" — пути для нового вендора, который понимает, что происходит.

**Что сделать:**
- Telegram-бот: добавить хендлер `/vendor_status` или уведомление при смене `approval_status` вендора (через audit log или отдельный event)
- Frontend VendorDashboardPage: показывать бейдж статуса ресторана (`moderation_status`) в списке ресторанов вендора с пояснением

---

#### 7. Промокоды: frontend не показывает все возможности модели

**Проблема:** Модель `Promo` поддерживает `first_order_only`, `min_order_amount`, `menu_category`. Но форма создания промокода в `VendorDashboardPage.jsx` (строки ~237-244) содержит только: `code`, `discount_type`, `discount_value`, `max_uses`, `expires_at`. Поля `first_order_only`, `min_order_amount`, `menu_category` недоступны из UI.

**Что сделать:**
- В форме создания промокода добавить поля: "Только первый заказ" (checkbox), "Минимальная сумма заказа" (number), "Категория меню" (select)
- При отображении активных промокодов — показывать все применённые условия

---

#### 8. RestaurantPage: можно делать заказ из закрытого ресторана
**Статус: ✅ Выполнено**
- ✅ Блокировка добавления в корзину в MenuItemCard и ProductSheet.
- ✅ Информационный баннер на странице ресторана.
- ✅ Передача статуса is_open через компоненты.

---

#### 9. Miniapp: нет deep link в конкретный ресторан/заказ из бота

**Проблема:** Бот отправляет кнопку "Открыть Foodize" (открывает главную miniapp). Но при уведомлении об изменении статуса заказа пользователь должен попасть сразу на страницу этого заказа.

> **Важно:** В качестве идентификатора в deep links всегда использовать `display_id` ресторана (поле уже есть в модели `Restaurant`), а не UUID. Для заказов — `display_id` заказа.

**Что сделать:**
- ✅ Bot handlers: передают `startapp` параметр.
- ✅ Miniapp `App.jsx`: обрабатывает `start_param` (order_XXX, restaurant_YYY) и выполняет редирект.
- ✅ SDK: добавлена функция `getStartParam`.

---

#### 10. Уведомления miniapp: WS подключается без retry при ошибке

**Проблема:** В `App.jsx` miniapp `connectWs(user.id)` подключает WS для уведомлений. Но `useNotificationStore` не имеет reconnect-логики. При разрыве — уведомления перестают приходить до перезагрузки.

**Что сделать:**
- В `useNotificationStore` / `notificationService` добавить reconnect with backoff (аналогично п.2)
- Показывать пользователю индикатор "нет соединения" в BottomNav badge или отдельном элементе

---

#### 11. Нет страницы / состояния для staff-заявки с ACCEPTED status
**Статус: ✅ Выполнено**
- ✅ Backend автоматически создает StaffProfile при одобрении заявки.
- ✅ Frontend корректно отображает кабинет сотрудника после одобрения.

---

#### 12. Display board: требует аутентификации, но предназначен для публичных экранов

**Проблема:** В `App.jsx` маршрут `/display-board` обёрнут в `<ProtectedRoute>`. Display Board (экран для кухни/зала) должен быть доступен без логина или через специальный PIN-код.

**Что сделать:**
- Убрать `ProtectedRoute` с маршрута `/display-board`
- Добавить защиту через `?token=` параметр (short-lived token) или PIN
- Backend: добавить endpoint для получения display-board данных с ограниченным доступом (только статусы PENDING/ACCEPTED/READY, без персональных данных)

---

#### 13. Vendor export: экспорт заказов формирует неверный date_from/date_to
**Статус: ✅ Выполнено**
- ✅ В VendorDashboardPage добавлены раздельные поля выбора даты "С" и "По".
- ✅ Экспорт учитывает выбранный диапазон.

---

#### 14. Отсутствует email-поле в регистрации / profile
**Статус: ✅ Выполнено**
- ✅ Поле email добавлено в форму регистрации (необязательно).
- ✅ Поле email добавлено в редактирование профиля.
- ✅ Backend поддерживает сохранение email.

---

#### 15. Bot: нет обработки ошибки "пользователь заблокировал бота"

**Проблема:** В `notifications/handlers.py` при `bot.send_message` ловится `Exception` и логируется warning. Но `aiogram` при `Forbidden` (пользователь заблокировал бота) должен деактивировать `telegram_id` в Redis чтобы не делать лишние запросы.

**Что сделать:**
- ✅ Обработка `TelegramForbiddenError` реализована.
- ✅ Автоматическая деактивация `user_tg:{user_id}` в Redis при блокировке бота.

---

### P2 — Важно для хорошего UX

#### 16. Skeleton-загрузка: часть компонентов показывает спиннер вместо skeleton

**Проблема:** `OrderStatusPage.jsx` имеет красивый skeleton. Но `VendorDashboardPage`, `AdminDashboardPage` — показывают `<div className="spinner"/>` при загрузке таблиц. Опыт мигания контента плохой.

**Что сделать:**
- Добавить skeleton-rows для таблиц в AdminDashboardPage (users, orders, restaurants, vendors, reviews)
- Добавить skeleton для карточек статистики (stats tab)

---

#### 17. Miniapp: кнопка "Повторить заказ" ведёт по `restaurant.id` (UUID), а не `display_id`

**Проблема:** В `OrderStatusPage.jsx` frontend (строка ~567): `navigate(ROUTES.RESTAURANT.replace(':id', currentOrder.restaurant_id))` — использует UUID. Miniapp тоже navigates по `r.id` (строка ~176 home page). Это работает, но URL `restaurant/a3b2c1...` некрасив.

**Что сделать:**
- В `OrderResponse` добавить поле `restaurant_display_id` (уже есть `display_id` у Restaurant)
- Обновить navigate: `restaurant_display_id || restaurant_id`

---

#### 18. Vendor: нет валидации при создании ресторана — дублирующийся адрес

**Проблема:** `Restaurant.address` имеет `unique=True` на уровне БД. При попытке создать второй ресторан с тем же адресом backend вернёт 500 или 422. Frontend показывает непонятную ошибку.

**Что сделать:**
- Backend: добавить явную проверку уникальности адреса с `409 Conflict` и понятным сообщением
- Frontend: `translateApiError` должен обрабатывать этот случай

---

#### 19. Admin audit log: отображается только 4 типа событий

**Проблема:** В `AdminDashboardPage.jsx` константа `AUDIT_ACTION_LABELS` содержит только 4 значения: APPROVE_VENDOR, REJECT_VENDOR, APPROVE_RESTAURANT, REJECT_RESTAURANT. Но в backend `audit_service.log_action` вызывается только для этих 4 действий. Изменения меню, промокодов, статусов заказов — не логируются.

**Что сделать:**
- ✅ Добавлен Audit Logging для:
  - Создание/изменение/удаление/toggle menu item.
  - Создание/деактивация промокода.
  - Модерация вендоров и ресторанов.
  - Изменение прав доступа (permissions).
- ✅ Централизованная логика в сервисном слое с actor_id.

---

#### 20. Telegram-бот: нет команды /orders для просмотра активных заказов

**Проблема:** Бот умеет только: `/start`, share phone, открыть miniapp. Нет inline-команд для просмотра заказов прямо в боте.

**Что сделать:**
- Добавить хендлер `/orders` в `handlers/`:
  - Запрашивает у backend активные заказы пользователя (через bot API secret или Telegram ID lookup)
  - Отображает последние 3 заказа с кнопками перехода в miniapp
- Добавить регистрацию команды в `main.py`

---

#### 21. Miniapp profile: нет возможности выйти из аккаунта (разлинковать Telegram)

**Проблема:** В miniapp `ProfilePage` нет кнопки выхода. Есть `localStorage.setItem("foodize_tg_logged_out", "1")` использование в `App.jsx` (строка ~175), то есть механизм logout задуман, но в UI кнопки нет.

**Что сделать:**
- В `ProfilePage.jsx` (miniapp) добавить кнопку "Выйти" или "Сменить аккаунт"
- При нажатии: `localStorage.setItem("foodize_tg_logged_out", "1")` + `window.location.reload()`
- Показывать сообщение что для входа нужно заново открыть miniapp через бота

---

#### 22. Miniapp: навигация в RestaurantPage использует UUID, а не display_id

**Проблема:** `HomePage.jsx` miniapp (строка ~176): `navigate("/restaurant/${r.id}", ...)` — использует UUID. В frontend-версии аналогичная строка уже обновлена на `display_id || id`. В miniapp — нет.

**Что сделать:**
- Заменить на `navigate("/restaurant/${r.display_id || r.id}", ...)`

---

#### 23. Нет rate-limiting на endpoint регистрации в miniapp/Telegram

**Проблема:** `POST /api/v1/telegram/bot/link-phone` и `POST /api/v1/register` используют `@limiter.limit("10/minute")`. Но Telegram bot-токен позволяет отправлять массовые запросы с разных аккаунтов. Нужна дополнительная защита.

**Что сделать:**
- Добавить rate limit на `link-phone` по `telegram_id` (не только по IP): `5/hour` per telegram_id
- Логировать подозрительные попытки

---

#### 24. Vendor: display_id ресторана и QR-код в vendor dashboard
**Статус: ✅ Выполнено**
- ✅ В VendorDashboardPage и AdminDashboardPage добавлены QR-коды для Telegram.
- ✅ URL формат: `https://t.me/{BOT_USERNAME}?start=restaurant_{display_id}`.
- ✅ display_id отображается в карточках ресторанов.

---

#### 25. Frontend: ProductPage (RestaurantPage) не показывает рабочие часы публично
**Статус: ✅ Выполнено**
- ✅ Рабочие часы отображаются в модальном окне информации о ресторане.
- ✅ Данные доступны публично без авторизации.

---

#### 26. Уведомления: бот не отправляет display_id заказа

**Проблема:** В `handle_order_placed` и `handle_order_status_changed` (bot handlers) текст сообщения не содержит номер заказа. Пользователь не знает, о каком заказе идёт речь если их несколько.

**Что сделать:**
- В `OrderPlacedEvent` и `OrderStatusChangedEvent` (backend `notifications/events.py`) добавить поле `display_id`
- Обновить bot handlers: включить `#display_id` в текст уведомления
- Обновить OpenAPI и generated clients

---

### P3 — Желательно до релиза

#### 27. CI: OpenAPI contract check не встроен в pipeline

**Проблема:** `make openapi` генерирует clients, но CI не проверяет что они актуальны. Если backend изменился без regeneration — frontend молча работает со старым контрактом.

**Что сделать:**
- В `.github/workflows/ci.yml` добавить шаг:
  ```yaml
  - run: make openapi
  - run: git diff --exit-code -- openapi/foodize.openapi.json src/frontend/src/services/generated src/telegram-miniapp/src/services/generated
  ```

---

#### 28. Alembic: нет проверки миграций в CI

**Что сделать:**
- Добавить в CI: `alembic check` (проверка что нет unpplied миграций) + `alembic upgrade head` на чистой БД

---

#### 29. Нет retry/dead-letter для RabbitMQ consumer в боте

**Проблема:** В `bot/notifications/consumer.py` `requeue=False` — при ошибке обработки сообщение теряется. Нет DLQ.

**Что сделать:**
- Настроить `x-dead-letter-exchange` для очередей бота
- При ошибке — requeue с ограничением по количеству попыток (max 3), затем DLQ
- Добавить метрику consumer lag

---

#### 30. Нет `.nvmrc` / единой версии Node.js
**Статус: ✅ Выполнено**
- ✅ Файл `.nvmrc` создан в корне проекта (версия 20).
- ✅ Версии Node.js синхронизированы.

---

#### 31. Backup/restore PostgreSQL не документирован

**Что сделать:**
- Добавить в `README.md` раздел "Backup & Restore" с командами `pg_dump` / `pg_restore`
- Добавить в `Makefile`: `make backup` и `make restore`

---

### Задача #32 (P2) — Telegram QR в vendor/admin кабинетах

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
