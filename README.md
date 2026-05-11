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
make tg        # start local Telegram bot testing through ngrok
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

Telegram Mini App auth uses Telegram `initData` validation on the backend. The Telegram bot can link a Telegram account to a Foodize user by phone number. A user can share their phone through Telegram or type it manually, then open the Foodize Mini App from the bot.

### What The Bot Does

- `/start` shows phone linking controls and, when configured, an `Open Foodize` Mini App button.
- `Share phone` links the Telegram user to an existing Foodize user by phone, or creates a new customer user.
- Manual phone input such as `+79990000000` works as a fallback.
- After linking, opening the Mini App authenticates the user through Telegram `initData`.
- Bot notifications use RabbitMQ and Redis to deliver order-related messages.

### Required Services

For local Telegram testing, these Compose services must be running:

```bash
docker compose up -d pg redis rabbitmq backend telegram-miniapp telegram-bot
```

Check status:

```bash
docker compose ps
```

The important services should be `Up`:

- `pg`
- `redis`
- `rabbitmq`
- `backend`
- `telegram-miniapp`
- `telegram-bot`

The regular desktop `frontend` is not required for Telegram Mini App testing.

### Environment

Create `.env` from `.env.example` and fill the Telegram values:

```env
BOT_TOKEN=1234567890:AA...
BOT_MODE=polling

MINI_APP_URL=https://your-public-miniapp-url

TELEGRAM__BOT_TOKEN=${BOT_TOKEN}
TELEGRAM__MINI_APP_URL=${MINI_APP_URL}
TELEGRAM__BOT_API_SECRET=some-long-local-secret
```

Notes:

- `BOT_TOKEN` comes from `@BotFather`.
- `TELEGRAM__BOT_API_SECRET` is a shared secret between `telegram-bot` and `backend`. It can be any long random string locally, but it must be the same value for both containers.
- `MINI_APP_URL` must be public HTTPS. Telegram cannot open `localhost`.
- In local development, use `BOT_MODE=polling`. Webhook mode is for server deployments with a public bot webhook URL.

After changing `.env`, recreate the containers that read it:

```bash
docker compose up -d --force-recreate backend telegram-miniapp telegram-bot
```

### Local Mini App Through Ngrok

The shortcut command for local Telegram testing is:

```bash
make tg
```

It starts the required Docker services, exposes the Mini App through ngrok, writes the HTTPS ngrok URL into `.env`, and recreates the Telegram services that read those values. Keep the command running while testing if it started ngrok in the current terminal.

The Mini App dev server runs on:

```text
http://localhost:5174
```

Verify it locally:

```bash
curl http://localhost:5174
```

Expose it through ngrok:

```bash
ngrok http 5174
```

If ngrok asks for auth, add the authtoken from the ngrok dashboard:

```bash
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

When ngrok starts, copy the HTTPS forwarding URL:

```text
Forwarding  https://example.ngrok-free.dev -> http://localhost:5174
```

Put that URL into `.env`:

```env
MINI_APP_URL=https://example.ngrok-free.dev
TELEGRAM__MINI_APP_URL=${MINI_APP_URL}
```

Then recreate:

```bash
docker compose up -d --force-recreate backend telegram-miniapp telegram-bot
```

Keep the ngrok terminal window open while testing. If ngrok stops or generates a new URL, update `.env`, recreate the containers, and update BotFather again.

### BotFather Setup

In Telegram:

1. Open `@BotFather`.
2. Run `/mybots`.
3. Select `FoodizeBot`.
4. Open `Bot Settings`.
5. Open `Menu Button`.
6. Choose `Configure menu button`.
7. Set the same HTTPS URL as `MINI_APP_URL`.
8. Use a label such as `Open Foodize`.

### Test Flow

1. Start all required containers.
2. Start ngrok and set `MINI_APP_URL`.
3. Recreate `backend`, `telegram-miniapp`, and `telegram-bot`.
4. Check bot logs:

```bash
docker compose logs telegram-bot --tail 50
```

You should see:

```text
Run polling for bot @FoodizeBot
```

5. Open `@FoodizeBot`.
6. Send `/start`.
7. Press `Share phone` or type a phone number manually.
8. Press `Open Foodize`.

If the database is empty, seed demo data:

```bash
make seed
```

### Common Local Issues

`TokenValidationError: Token is invalid!`

`BOT_TOKEN` is missing, has spaces, or is not the token from `@BotFather`. Fix `.env` and recreate `telegram-bot`.

`Bot is silent after /start`

Check that `telegram-bot` is running:

```bash
docker compose ps telegram-bot
docker compose logs telegram-bot --tail 100
```

`Bot not configured for registration: TELEGRAM__BOT_API_SECRET is not set`

Set `TELEGRAM__BOT_API_SECRET` in `.env`, then recreate `backend` and `telegram-bot`.

`ERR_NGROK_3200 endpoint is offline`

The ngrok process is stopped or the URL changed. Start ngrok again and update `MINI_APP_URL` and BotFather if the URL changed.

`Blocked request. This host is not allowed`

Vite blocked the ngrok host. The Telegram Mini App Vite config allows `.ngrok-free.dev`; restart `telegram-miniapp` after config changes:

```bash
docker compose up -d --force-recreate telegram-miniapp
```

`Mini App opens but has no data or buttons do not work on phone`

The phone cannot reach `localhost:8000`. The local Mini App uses a relative API URL (`/api/v1`) and Vite proxies `/api` to `backend:8000`. Recreate `telegram-miniapp` after changing this config:

```bash
docker compose up -d --force-recreate telegram-miniapp
```

`Microsoft sign-in or 403 page opens instead of Foodize`

The URL configured in `MINI_APP_URL` or BotFather points to a protected page, not the public Mini App. Use the ngrok HTTPS URL that forwards to `localhost:5174`.

### Production Notes

For a real deployment, use a stable public HTTPS domain instead of ngrok, for example:

```env
MINI_APP_URL=https://app.foodize.example
```

Polling mode can work in production, but webhook mode is also supported if the `telegram-bot` service is exposed through HTTPS:

```env
BOT_MODE=webhook
BOT_WEBHOOK_URL=https://bot.foodize.example
BOT_WEBHOOK_SECRET=another-long-secret
```

## Monitoring

Start Prometheus and Grafana with:

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

Prometheus: `http://localhost:9090`
Grafana: `http://localhost:3000`
