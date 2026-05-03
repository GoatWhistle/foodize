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
| `Makefile` | Команды `sync`, `lint`, `test`, `keys`, `build`, `up`, `down`, `stop`, `logs`. |
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

- `README.md` почти пустой. Для командной работы лучше перенести туда быстрый старт, переменные окружения, запуск, тесты и архитектуру.
- В `.env.example` и некоторых исходниках русские комментарии/строки отображаются с mojibake в текущем окружении PowerShell. Нужно проверить кодировку файлов, вероятно привести к UTF-8.
- Внутри репозитория есть вложенная папка `Khorokhorin/Desktop/foodize/src/backend/certs`. Она выглядит как случайный артефакт пути. Если там только локальные ключи, их лучше удалить из проекта и оставить ключи в `src/backend/certs`, который должен быть в `.gitignore`.
- CI использует Node.js 20, а Dockerfile для frontend и miniapp использует Node.js 22.17.0. Лучше выровнять версии.
- `docker-compose.monitoring.yml` использует отдельную сеть `foodize_net`, а основной compose - `foodize-network`. Для совместного запуска мониторинга и приложения стоит проверить сетевую схему.
- Основной frontend и miniapp имеют много похожих services/store/components. Можно выделить общий пакет или аккуратно синхронизировать общие части, чтобы не чинить одно и то же дважды.
- Есть мониторинг метрик, но не видно готовых Grafana dashboard provisioning файлов.
- Telegram Mini App зависит от `VITE_API_URL=http://localhost:8000/api/v1`; для реального Telegram нужен публичный HTTPS backend URL.

## Что можно добавить

### Документация и запуск

- Полный `README.md`: описание продукта, архитектура, требования, быстрый старт, Docker-запуск, локальный запуск без Docker, тесты, миграции, Telegram-настройка.
- `docs/architecture.md`: схема сервисов, поток заказа, поток уведомлений, роли и права.
- `docs/api.md` или ссылка на OpenAPI `/docs`.
- `docs/env.md`: описание всех переменных окружения без секретов.
- `docs/deployment.md`: как деплоить backend, frontend, miniapp, bot, worker и мониторинг.

### Продуктовые функции

- Поиск ресторанов и блюд с фильтрами по категории, рейтингу, времени приготовления, открытости и доставке/самовывозу.
- Геолокация и зоны обслуживания ресторанов.
- Онлайн-оплата или подготовленная интеграция с платежным провайдером.
- Купоны с более гибкими правилами: лимиты, период действия, минимальная сумма, конкретные рестораны.
- История изменения заказа для пользователя и ресторана.
- Отмена заказа с причинами и правилами по времени.
- Чат или быстрые сообщения между клиентом и рестораном по заказу.
- Избранные блюда, а не только рестораны.
- Рекомендации блюд/ресторанов на основе истории заказов.
- Фотографии блюд и ресторанов с загрузкой в S3-compatible storage.

### Панели ресторана и админа

- CRUD для рабочих часов прямо в vendor dashboard.
- Управление доступностью блюд и стоп-листом.
- Экспорт заказов/финансов в CSV/XLSX.
- Детальная финансовая аналитика: комиссии, возвраты, средний чек, конверсия.
- Модерация фотографий, меню и отзывов.
- Audit log для действий админа, вендора и персонала.
- Расширенная RBAC-модель с granular permissions.

### Telegram

- Deep links в конкретный ресторан или заказ.
- Push-уведомления о статусе заказа в Telegram.
- Команды бота для просмотра активного заказа.
- Webhook-only production mode с инструкцией для HTTPS/nginx.
- Проверка подписи Telegram initData с тестами edge cases.

### Надежность и безопасность

- Rate limits на чувствительные endpoint-ы, не только auth.
- Refresh token rotation и хранение blacklist/session table.
- Password reset и email/phone verification.
- Проверка CORS/CSRF модели для production.
- Idempotency keys для создания заказов.
- Outbox pattern для надежной публикации событий заказов.
- Structured logging dashboard и correlation по request_id.
- Backup/restore инструкция для PostgreSQL.

### Качество и CI/CD

- Backend coverage gate в CI.
- Тесты Telegram bot и miniapp.
- E2E-тесты Playwright для основных сценариев: регистрация, корзина, заказ, смена статуса.
- Docker image build в CI.
- Проверка миграций Alembic в CI.
- Автоматическая генерация OpenAPI schema artifact.
- Pre-commit hook или CI-check на отсутствие `.env`/ключей/секретов.

### UX/UI

- Skeleton/loading states для ресторанов, меню и заказов.
- Более явные empty/error states во всех кабинетах.
- Accessibility pass: focus states, aria-label, keyboard navigation.
- Адаптивные таблицы в admin/vendor/staff dashboard.
- Toast-уведомления для успешных/ошибочных действий.
- Единая дизайн-система для frontend и miniapp.

## Приоритетный план улучшений

1. Расширить `README.md` быстрым стартом и ссылкой на этот обзор.
2. Проверить и убрать случайную вложенную папку `Khorokhorin/...`, если это артефакт.
3. Выровнять версии Node.js в CI и Docker.
4. Исправить кодировку русских строк/комментариев на UTF-8.
5. Добавить `docs/env.md` и `docs/deployment.md`.
6. Добавить Playwright smoke-тесты для главного пользовательского сценария.
7. Усилить Telegram production-flow: публичные URL, webhook docs, подпись initData, уведомления.
8. Добавить audit log и export CSV/XLSX для admin/vendor.
