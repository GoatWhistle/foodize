# Foodize

Foodize is a food pre-ordering platform for customers, restaurants, staff, admins, and Telegram Mini App users.

## Stack

- Backend: FastAPI, SQLAlchemy async, Alembic, PostgreSQL, Redis, RabbitMQ
- Frontend: React, Vite, Zustand, Axios
- Telegram Mini App: React, Vite, Telegram WebApp SDK
- Telegram Bot: aiogram
- Infra: Docker Compose, Prometheus, Grafana

## Quick Start

```bash
make sync
make keys
make up
```

Main local services:

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:5173`
- Telegram Mini App dev server: `http://localhost:5174`
- RabbitMQ UI: `http://localhost:15672`

## Environment

Create a local `.env` from `.env.example` and fill required values:

```bash
cp .env.example .env
```

JWT keys are generated into `src/backend/certs`:

```bash
make keys
```

Use `FORCE=1` only when you intentionally want to rotate local keys:

```bash
make keys FORCE=1
```

## Development Commands

```bash
make sync      # install backend, bot, frontend, and miniapp dependencies
make lint      # backend pre-commit, frontend lint, miniapp lint
make test      # backend pytest and frontend vitest
make openapi   # export OpenAPI schema and regenerate frontend/miniapp clients
make build     # build Docker services
make up        # start Docker services
make down      # stop and remove Docker services
make logs      # follow Docker logs
```

## Backend

Backend code lives in `src/backend`.

Useful commands:

```bash
cd src/backend
uv run pytest
uv run ruff check .
uv run mypy .
alembic upgrade head
```

Order statuses are intentionally short:

- `PENDING`: restaurant sees `Ожидается`
- `ACCEPTED`: restaurant sees `Принято`
- `READY`: restaurant sees `Готово`
- `COMPLETED`: restaurant sees `Отдал`, customer sees `Выполнено`

Customers see the simplified flow: `Ожидается` until the order is completed, then `Выполнено`.

## OpenAPI Contract

The backend is the source of truth for the API contract. Generated clients are committed for both frontend apps.

Regenerate the contract locally:

```bash
make openapi
```

CI runs the same generation and fails if generated files are stale:

```bash
make openapi
git diff --exit-code -- openapi/foodize.openapi.json src/frontend/src/services/generated src/telegram-miniapp/src/services/generated
```

If this fails, commit the updated OpenAPI schema and generated clients together with the backend change.

## Idempotency

`POST /api/v1/orders/` supports the `Idempotency-Key` header. Repeating the same request with the same key returns the original order instead of creating a duplicate.

Frontend and Telegram Mini App generate this key automatically during checkout.

## Outbox

Order events are written to the `outbox_events` table and published by the backend worker. This prevents losing RabbitMQ notifications when an order is committed but the broker is temporarily unavailable.

Run the worker through Docker Compose or directly:

```bash
cd src/backend
uv run python -m worker.main
```

## Telegram

Telegram Mini App auth uses Telegram `initData` validation on the backend. Production use requires public HTTPS URLs and a configured bot token.

## Monitoring

Start Prometheus and Grafana with:

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Prometheus: `http://localhost:9090`
Grafana: `http://localhost:3000`
