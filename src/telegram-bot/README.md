# Foodize Telegram Bot

The Foodize Telegram bot: it links a Telegram user to a Foodize account (by phone
number), launches the Mini App, and delivers order notifications pushed from the backend
through RabbitMQ.

## Tech stack

- Python 3.13
- aiogram 3 — Telegram bot framework
- `aio-pika` — RabbitMQ consumer for backend notification events
- `redis` — throttling / state
- `httpx` — backend HTTP client
- `pydantic-settings` — configuration
- `aiohttp` (+ `aiohttp-socks`) — health/webhook HTTP server and optional SOCKS proxy
- Tooling: `uv`, `pytest` (+ `pytest-asyncio`, `pytest-cov`), `mypy` (strict), `ruff`,
  `black`
- License: MIT

## Prerequisites

- Python 3.13+
- [`uv`](https://docs.astral.sh/uv/)
- A running backend API, Redis, and RabbitMQ (provided by the repo
  `docker-compose.yaml`)
- A Telegram bot token

## Getting started

The bot runs as part of the repo-root Docker stack (`make up`). To run it directly:

```bash
uv sync
uv run python main.py
```

At minimum set `BOT_TOKEN`. The bot runs in **polling** mode by default (`BOT_MODE`);
`webhook` mode additionally requires `BOT_WEBHOOK_URL` and `BOT_WEBHOOK_SECRET`. It
serves a health endpoint on `:8080/health`, and (in webhook mode) accepts updates on
`/webhook`.

For local testing inside Telegram, `make tg` (from the repo root) starts the stack and
exposes the Mini App through ngrok.

## Configuration

Environment variables (via `.env` / the stack), from `config.py`:

| Variable | Default | Purpose |
|---|---|---|
| `BOT_TOKEN` | — (required) | Telegram bot token |
| `BACKEND_URL` | `http://backend:8000` | Foodize backend base URL |
| `MINI_APP_URL` | `""` | Mini App URL opened from the bot |
| `TELEGRAM_BOT_API_SECRET` | `""` | Shared secret for backend calls |
| `REDIS__URL` | `redis://redis:6379/0` | Redis connection |
| `RABBITMQ__URL` | `amqp://foodize:foodize@rabbitmq:5672/foodize` | RabbitMQ connection |
| `BOT_MODE` | `polling` | `polling` or `webhook` |
| `BOT_WEBHOOK_URL` | `""` | Required when `BOT_MODE=webhook` |
| `BOT_WEBHOOK_SECRET` | `""` | Required when `BOT_MODE=webhook` (secures `/webhook`) |
| `BOT_PROXY_URL` | `""` | Optional SOCKS/HTTP proxy for the bot session |

## Commands

```bash
uv sync                    # install dependencies
uv run python main.py      # run the bot
uv run pytest              # run tests (with coverage; fail_under=85)
uv run mypy .              # strict type check
uv run ruff check .        # lint
uv run black .             # format
```

From the repo root, `make lint` and `make test` include this service.

## Project structure

| Path | Contents |
|---|---|
| `main.py` | Entry point: builds the bot/dispatcher, wires middleware, starts polling or webhook, and launches the notification consumer + health server |
| `config.py` | `pydantic-settings` configuration (`BotConfig`) |
| `handlers/` | Update handlers: `start`, `start_flow`, `backend_calls`, `deep_links` |
| `keyboards/` | Inline/reply keyboards (`start_keyboards.py`) |
| `middlewares/` | `throttling.py` (Redis-backed throttling) |
| `notifications/` | RabbitMQ consumer (`consumer.py`), event models (`events.py`), send handlers (`handlers.py`) |
| `services/` | `backend_client.py` (httpx), `redis_client.py`, `payloads.py` |
| `filters/` | aiogram filters |
| `i18n/` | Translations: `translate.py`, `types.py`, `dictionaries/` |
| `utils/` | Helpers (logging setup, phone, etc.) |
| `exceptions.py` | Bot-specific exceptions |
| `tests/` | `pytest` suite |

## Notifications

The backend publishes order events to RabbitMQ; `notifications/consumer.py` consumes
them and sends Telegram messages to the linked user. The consumer runs as a background
task alongside the bot for both polling and webhook modes.

## Linting & testing

- `ruff`, `black`, and strict `mypy` (with `disallow_any_explicit`).
- `pytest` with `asyncio_mode = "auto"` and coverage `fail_under` of 85%.

## Monorepo

See the [root README](../../README.md) for the full architecture and the Docker quick
start.
