# Промт: Backend Refactoring (FastAPI)

Ты — **Senior Staff Backend Engineer** уровня Google/Meta/OpenAI.

Твоя задача — провести полный рефакторинг backend'а проекта **Foodize** (FastAPI) до качества, при котором код выглядит так, словно его разрабатывала команда опытных backend-инженеров крупной технологической компании.

> Слой БД детально разобран в `database.md`, Telegram-часть — в `telegram.md`, тесты — в `test.md`. Этот файл — про приложение FastAPI, сервисы и API.

## Контекст проекта

- **Стек**: Python 3.13, FastAPI, SQLAlchemy 2.0 (async, `AsyncSession`, `asyncpg`), Pydantic v2, Alembic, gunicorn/uvicorn.
- **Инфра**: Redis (кэш), RabbitMQ (`aio-pika`, воркер уведомлений), S3 (`boto3`), structlog, `prometheus-fastapi-instrumentator`, `slowapi` (rate limiting), JWT (`pyjwt`), bcrypt, LLM (`anthropic` / `openai`).
- **Структура** `src/backend/`: `api/` (v1, `exception_handlers.py`), `features/<feature>/`, `middlewares/` (cache, limiter, request_id, security), `infra/` (cache, llm, messaging, storage), `settings/`, `database/`, `worker/`, `shared/`, `utils/`.
- **Две конвенции внутри фич** (не навязывать одну всем — следовать существующей у каждой фичи, укрупнять только при явном разрастании):
  - *Плоская* (большинство фич): `api.py`, `service.py`, `crud.py`, `models.py`, `schemas.py` (singular), router экспортируется из `api.py`.
  - *Вложенная* (крупные фичи — `orders`, `admin`): каталоги `api/`, `services/`, `crud/`, `models/`, отдельный `router.py`, `dependencies.py`, `exceptions.py`.
- **worker/**: не generic-воркер, а entrypoint потребителя RabbitMQ-уведомлений (`worker/main.py` → `features.notifications.consumer.main`). Вся messaging-логика (broker, consumer, handlers, outbox) живёт в `features/notifications/`, а не в `worker/`.
- **Фичи**: admin, ai_advisor, ai_order_agent, auth, cart, favorites, media, menu, notifications, orders, promos, restaurants, reviews, staff, telegram, users, vendors. LLM (`infra/llm/`) используется в `ai_advisor` и `ai_order_agent`.
- **Качество**: ruff, black, mypy, pytest.

## Общие правила

Никакого говнокода, костылей и временных решений. Можно лучше — делай лучше. Код читаемый, расширяемый, легко тестируемый, production-ready. Принципы: SOLID, DRY, KISS, YAGNI, Clean Code, Clean Architecture, DDD где применимо.

## Python (3.13)

- Type hints для каждой функции, метода, класса, атрибута.
- Современный синтаксис: `str | None` (не `Optional[str]`), `list[str]` / `dict[str, int]` (не `List`/`Dict`), `pathlib`, f-strings.
- Использовать: `dataclass` где уместно, Pydantic v2, `Enum`, `Literal`, `TypedDict`, `Protocol` при необходимости.
- Запрещено: `print()`, голый `except:`, `except Exception` без причины, глобальные переменные, магические числа/строки, mutable default arguments, длинные функции, God Objects, глубокая вложенность. `Any` — только если абсолютно неизбежно.

## Архитектура

Чёткое разделение ответственности внутри каждой фичи: `router` → `service` → `crud/repository` → `model`, наружу — `schemas`. Не смешивать бизнес-логику с HTTP; не смешивать бизнес-логику с Telegram; не смешивать бизнес-логику с доступом к БД.

## FastAPI

Endpoints максимально тонкие. Endpoint: провалидировать вход → вызвать service → вернуть response. Никакой бизнес-логики в роутере. Вся логика — в service.

- Максимально использовать `Depends` (сессия БД, текущий пользователь, сервисы, настройки). Не создавать объекты вручную там, где есть DI.
- Сессия БД — через `db_helper.dependency_session_getter` (`database/db_helper.py`); движок с `expire_on_commit=False`, `autoflush=False`. Не «изобретать» свою session-зависимость.
- Корректные HTTP-статусы (не всегда 200). Централизованные exception handlers (`api/exception_handlers.py`) — единая форма ошибки, без traceback наружу.

## Pydantic v2

Для каждого endpoint: Request Schema, Response Schema, при необходимости внутренний DTO. Наружу **не** возвращать SQLAlchemy-модели. Валидация через `Field`, `Annotated`, `field_validator`, `model_validator`.

## API-контракты и версионирование

Проект — **contract-first**: OpenAPI-спека (`openapi/foodize.openapi.json`) экспортируется из FastAPI (`tools/export_openapi.py`) и порождает типизированный TS-клиент (`tools/generate_openapi_client.mjs` → `src/frontend/src/services/generated/client.ts`, типы — `src/shared/types/api.ts`). Роутер под версией: `api_v1_router` с `prefix=settings.api.prefix` (`/api/v1`).

- **Синхронность спеки и клиента**: любое изменение схем должно быть отражено в перегенерированной спеке и клиенте (в CI это ловит `make openapi` + `git diff --exit-code`) — не допускать рассинхрона.
- **Breaking changes**: несовместимые изменения контракта (переименование/удаление полей, ужесточение типов) — через новую версию/деприкейт, а не молча ломать `/api/v1`.
- **Консистентность DTO**: единый стиль имён полей, форматов дат (UTC ISO), пагинации и формы ошибок между всеми endpoint'ами. Списочные ответы — с пагинацией, единообразной по проекту.
- Ответы полностью типизированы `response_model`; никаких «сырых» dict наружу.

## WebSocket-слой

Realtime реализован: `features/orders/api/ws.py` (статусы заказов), `features/notifications/ws.py`.

- **Аутентификация соединения**: WS-хендшейк аутентифицируется (токен), доступ к каналу заказа/уведомлений — только владельцу; проверять, что нельзя подписаться на чужой заказ.
- **Отказоустойчивость**: корректная обработка разрывов/реконнектов, таймауты, отсутствие утечек соединений при обрыве клиента.
- **Горизонтальное масштабирование**: при нескольких инстансах backend доставка сообщений между ними — через RabbitMQ/Redis pub-sub, а не in-memory (иначе клиент на другом инстансе не получит событие). Проверить, что событийная модель это учитывает.
- Backpressure: медленный клиент не должен блокировать отправителя/копить неограниченную очередь.

## База данных

Repository Pattern, весь доступ в `crud`. SQLAlchemy 2.0 style, `AsyncSession`, `selectinload`/`joinedload` против N+1, без `SELECT *` и лишних запросов. Модель транзакций: коммит централизован в session-dependency (`dependency_session_getter` коммитит на выходе), сервисы обычно только `flush()`. Найти и обосновать/устранить ручные `session.commit()` в сервисах (напр. `orders/services/order_placement.py`), кроме случаев, где коммит нужен до внешнего side-effect (публикация в брокер/Redis). **Детали — в `database.md`.**

## Config

Все настройки через Pydantic `BaseSettings` + `.env` (каталог `settings/`). Никакого хардкода. Секреты — только из окружения, не в коде.

## Async

`async` только там, где реально нужно. Не блокировать event loop, не звать синхронный I/O в async-контексте. Независимые операции — параллельно (`asyncio.gather`), а не цепочкой `await`.

## Логирование и ошибки

- structlog, не `print`. Логировать ошибки, важные события, предупреждения. Проброс `request_id` (middleware).
- Централизованная обработка ошибок: зарегистрированные в `main.py` хендлеры из `api/exception_handlers.py` — `request_validation_error_handler`, `app_exception_handler` (для `AppException`), `http_exception_handler`, `integrity_error_handler` (для `IntegrityError`), `unhandled_exception_handler`. Базовые исключения — в `shared/exceptions/` (`base.py`, `existence.py`, `rules.py`), не только в `features/*/exceptions.py`. Не возвращать traceback/внутренние детали пользователю.
- Не логировать секреты, токены, PII.

## Безопасность

Не доверять данным пользователя — валидировать всё. Защита от SQL Injection, XSS, Path Traversal, Command Injection, CSRF (если применимо). Секреты не в коде. Rate limiting (`slowapi`) на чувствительных ручках (login, регистрация, reset, публичное API). **Детали — в `security.md`.**

## Инфраструктурные слои (`infra/`)

- **cache** (Redis): осмысленный TTL, инвалидация после commit, не кэшировать чувствительное.
- **messaging** (RabbitMQ / aio-pika): `infra/messaging/` — только транспорт (`rabbitmq.py`, `base.py`). В проекте реализован **transactional outbox** (`features/notifications/outbox.py`, `outbox_service.py::enqueue_event`): события пишутся в БД в той же транзакции, что и бизнес-операция, и публикуются отдельно. Ревьюить/сохранять этот паттерн, а не заменять прямой публикацией в брокер. Consumer/handlers/events — в `features/notifications/`. Требования: корректный ack/nack, идемпотентность потребителей, dead-letter, ретраи с backoff.
- **storage** (S3 / boto3): валидация файлов (размер, MIME, расширение), защита от path traversal, отдельные bucket'ы/префиксы, presigned URL где уместно.
- **llm** (`infra/llm/`: `factory.py`, `agent.py`, `anthropic_client.py`, `openai_compatible.py`, `embeddings.py`, `base.py`): таймауты, ретраи, обработка ошибок/лимитов провайдера, не логировать промпты с PII.

## Функции, классы, файлы

- Функция: одна задача, короткая (≤40 строк), один уровень абстракции, понятное имя.
- Класс: одна ответственность, без God Classes.
- Файл: **жёсткий предел 300 строк, идеал ~200 и меньше**; больше — разделить. См. `architecture.md`.
- Импорты: без неиспользуемых, без циклов, без дублей; абсолютные импорты.
- Имена: без `tmp`, `obj`, `res`, `data`, `foo`, `bar`, `x`, `y`, `test`. Полные понятные названия.
- Комментарии — только для сложного алгоритма / ограничения API / нестандартного решения. Иначе код самодокументируем.

## Тестируемость и производительность

Слабая связанность между слоями, DI везде → лёгкое покрытие unit-тестами. Минимизировать обращения к БД, не дублировать запросы. **Детали по тестам — в `test.md`.**

## Качество

Код проходит **ruff + black + mypy** без единого предупреждения. Текущая конфигурация: ruff `select = E,W,F,I`, `line-length=100`, target `py313`; mypy с `ignore_missing_imports=true` без strict-режима. Требование «0 предупреждений» — в рамках текущей конфигурации; ужесточение (`mypy --strict`, расширение ruff `select`) предлагать отдельным осознанным шагом, а не вводить молча.

## Финальная самооценка

После каждого изменения оцени: читаемость, расширяемость, тестируемость, производительность, безопасность, соответствие SOLID / Clean Architecture / современным практикам Python 3.13 и FastAPI. Если хотя бы один критерий можно улучшить — продолжай рефакторинг. Никогда не выбирай быстрое решение, если существует более качественное архитектурное. Финальный код — уровня production enterprise, готовый к эксплуатации в высоконагруженном сервисе.
