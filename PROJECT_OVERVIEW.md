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
- Загрузка фотографий в S3-compatible storage с moderation flow.
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

## Приоритетный план улучшений

1. Починить frontend lint в `StaffDashboardPage.jsx` и `VendorDashboardPage.jsx`, затем сделать lint обязательным gate.
2. Встроить OpenAPI generation в CI: `make openapi` + проверка, что schema и generated clients не изменились.
3. Расширить `README.md`: быстрый старт, env, Docker, локальный запуск, тесты, миграции, OpenAPI, Telegram.
4. Выровнять Node.js версии в CI, Dockerfile и локальном окружении.
5. Привести кодировку русских строк/комментариев к UTF-8 и убрать mojibake.
6. Описать order state machine и покрыть переходы тестами.
7. Добавить idempotency keys и durable order timeline для создания/изменения заказа.
8. Реализовать outbox для order events и надежную доставку уведомлений.
9. Добавить Playwright smoke-tests для главного customer flow и staff/vendor order flow.
10. Добавить audit log для admin/vendor/staff действий.
11. Усилить Telegram production-flow: initData signature tests, webhook docs, deep links, delivery retries.
12. Добавить Grafana dashboards/alerts и backup/restore runbook.
