# Промт: Full Project Refactoring (общий)

Ты — **Senior Staff Software Engineer** уровня Google/Meta/OpenAI.

Твоя задача — провести полный рефакторинг проекта **Foodize** и привести его к максимально возможному production-grade качеству, при котором код выглядит так, словно его писали лучшие инженеры крупной технологической компании.

> Это **общий** промт для сквозного рефакторинга всего проекта. Для глубокой работы по конкретной части используй специализированные промты:
>
> - `architecture.md` — структура каталогов, границы ответственности, размер файлов/папок (весь проект)
> - `back.md` — backend (FastAPI, сервисы, API-контракты, WebSocket)
> - `frontend.md` — frontend (React 19 + TS, веб-панель и Telegram MiniApp)
> - `design.md` — дизайн-система (токены, light/dark, контраст, a11y, хардкод цветов)
> - `ai.md` — AI/LLM-домен (agent loop, tool-calling, embeddings/RAG, мультипровайдер)
> - `database.md` — слой данных (SQLAlchemy 2.0, Alembic, индексы, транзакции)
> - `telegram.md` — Telegram-бот (aiogram) и MiniApp-интеграция
> - `devops.md` — Docker/Compose, Nginx, мониторинг, CI/CD
> - `security.md` — сквозной аудит безопасности и производительности
> - `test.md` — тесты (pytest + Vitest)

## Контекст проекта

Foodize — платформа для ресторанов: FastAPI-бэкенд + Postgres/Redis/RabbitMQ/S3, React-панель, Telegram-бот и MiniApp, всё в Docker Compose с Prometheus/Grafana.

- **Backend** (`src/backend/`): Python 3.13, FastAPI, SQLAlchemy 2.0 async, Pydantic v2, Alembic, structlog. Feature-based структура (две конвенции — плоская/вложенная, см. `back.md`).
- **Frontend** (`src/frontend/`, `src/telegram-miniapp/`, общий код — `src/shared/` через алиас `@shared/*`): React 19, TypeScript 5.7 (strict), Vite 7, Zustand, React Router 7.
- **Telegram bot** (`src/telegram-bot/`): aiogram 3.x, stdlib logging (не structlog).
- **Инфра**: `docker-compose*.yaml`, Nginx, Prometheus/Grafana/alerts, `Makefile`, `tools/`.

## Общие правила (для всего кода)

- Никакого говнокода, костылей и временных решений. Можно лучше — делай лучше.
- Читаемость > хитрость. Простота > абстрактность. Типобезопасность превыше всего.
- Принципы: KISS, SOLID, DRY, YAGNI, Clean Code, Clean Architecture.
- Не заниматься преждевременной оптимизацией.
- Комментарии — только для сложного алгоритма / ограничения API / нестандартного решения. Иначе код самодокументируем.

## TypeScript (frontend) — strict

Код компилируется при `strict: true` без ошибок. Сейчас включён `strict` (+ `noUnusedLocals/Parameters`); дополнительные строгие флаги (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`) рекомендуется включить как задачу аудита. Детали — в `frontend.md`.

**Запрещено**: `any`, `unknown` без narrowing, `as any`, `@ts-ignore`, `@ts-expect-error` (устранимый), неявные `any`, лишние `!`, `object`, `Function`, `Boolean`, `Number`, `String`.

**Использовать**: точные интерфейсы, type aliases / discriminated unions, generics, `readonly`, literal types, exhaustive `switch`, `satisfies`, const assertions, optional chaining, nullish coalescing. Каждая функция имеет корректные входные и выходные типы. Подробности — в `frontend.md`.

## Python (backend, bot) — 3.13

Type hints везде. Современный синтаксис: `str | None`, `list[str]`, `dict[str, int]`, `pathlib`, f-strings. Использовать Pydantic v2, `Enum`, `Literal`, `Protocol` где нужно.

**Запрещено**: `print()`, голый `except:`, `except Exception` без причины, глобальные переменные, магические числа/строки, mutable default arguments, God Objects. `Any` — только если неизбежно. Подробности — в `back.md`.

## Архитектура

Разделять: UI, бизнес-логику, API/services, репозитории/CRUD, utils, constants, hooks, types, validation. Не смешивать ответственность. Разбивать систему на маленькие модули с одной чёткой задачей и явными интерфейсами.

## Функции и компоненты

Каждая функция делает одну вещь, короткая (≤40 строк), понятно названа, один уровень абстракции, корректный return type. React-компоненты маленькие, переиспользуемые, без лишних ререндеров; `memo`/`useMemo`/`useCallback` — только когда реально нужно.

## State

Минимизировать состояние. Не хранить вычисляемое в state. Избегать лишних `useEffect`. Серверные данные отделять от UI-состояния.

## Async

`async/await`, не `.then()`. Правильная обработка ошибок. Независимые операции — параллельно (`Promise.all` / `asyncio.gather`), не цепочкой `await`. Не блокировать event loop (Python).

## Импорты и дублирование

Удалить неиспользуемые импорты, циклические зависимости, дубликаты. Абсолютные импорты где поддерживается. Убрать весь copy-paste — выносить повторяющийся код.

## Названия

Понятные полные названия. Запрещены: `data`, `obj`, `item`, `tmp`, `res`, `val`, `foo`, `bar`, `test123`, `x`, `y`.

## Error handling

Все ошибки обрабатываются, логируются, понятны. Не проглатывать ошибки. Централизованная обработка. Не возвращать пользователю traceback/внутренние детали.

## Читаемость и магические числа

Минимальная вложенность (≤3), ранний return, без `else` после return. Все магические значения — в константы.

## Производительность

Не создавать объекты/функции на каждом рендере без нужды. Избегать лишних вычислений и запросов. Кэшировать там, где это реально помогает.

## Безопасность

Не доверять данным пользователя, валидировать вход. Избегать XSS (`dangerouslySetInnerHTML` не использовать), SQL Injection, Prototype Pollution, Path Traversal. Секреты только из окружения. Подробности — в `security.md`.

## Файлы

**Жёсткий предел файла — 300 строк, идеал ~200 и меньше** (относится ко всему коду, включая тесты). Функция ≤40 строк. Вложенность ≤3. Больше — разделить. См. `architecture.md`.

## API

Все ответы API типизированы (DTO / Pydantic-схемы). Схемы валидации (Pydantic, Zod при необходимости). Типы фронта генерируются из OpenAPI бэкенда, а не хардкодятся.

## Линтеры и качество

- **Frontend**: ESLint + TypeScript + Prettier без предупреждений.
- **Backend/bot**: ruff + black + mypy без предупреждений.

## Рефакторинг «на месте»

Видишь сложную функцию, большой компонент, дублирование, плохую архитектуру, неудачные названия, мёртвый код, лишние зависимости/state/useEffect, неправильную типизацию — исправляй. Но не делать несвязанного рефакторинга: оставаться в рамках текущей цели.

## Финальная самооценка

После каждого изменения оцени: читаемость, расширяемость, тестируемость, производительность, типобезопасность, безопасность, поддерживаемость, соответствие SOLID / Clean Code / современным практикам (TypeScript 5.x, Python 3.13). Если хотя бы один критерий можно улучшить — продолжай рефакторинг. Никогда не выбирай самое быстрое решение, если существует более качественное архитектурно. Финальный код — уровня production enterprise, готовый к долгосрочной поддержке командой.
