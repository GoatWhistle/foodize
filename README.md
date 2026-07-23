# Foodize

Foodize is a food pre-ordering platform that connects customers with local restaurants.
Customers build an order and pick a pickup time; restaurants manage their menus and
process orders. The platform is reachable from a web app, a Telegram Mini App, a Telegram
bot, and a React Native mobile app. Two conversational AI agents are built in: an order
assistant for the customer and an AI business advisor for the venue owner.

## Features

**Customers**
- Restaurant and menu catalog, cart, orders with a pickup time.
- Dish options and modifiers, promo codes, favorites, reviews and ratings.
- Push notifications about order status (WebSocket + Telegram).
- **AI order assistant** — finds dishes and places the order in chat.

**Restaurants / vendors**
- Menu management (items, categories, options, availability).
- Real-time incoming-order feed, status management.
- Financial analytics and advanced statistics, export (CSV / PDF).
- Staff and permission management.
- **AI business advisor** — sales breakdowns and recommendations in chat.

**Staff and admins**
- Staff role with an order pickup screen (display board).
- Admin panel: restaurant and vendor moderation, users, permissions (RBAC), platform
  statistics, exports, action audit.

**Telegram**
- Mini App with `initData` authentication.
- Bot (aiogram): account linking by phone number, order notifications.

## Services

The monorepo contains six services under `src/`, each with its own README:

| Service | Path | Stack |
|---|---|---|
| Backend API | [`src/backend`](src/backend/README.md) | FastAPI, Python 3.13, SQLAlchemy (async), Alembic, PostgreSQL, Redis, RabbitMQ |
| Web frontend | [`src/frontend`](src/frontend/README.md) | React 19, Vite, TypeScript, Zustand, Axios |
| Shared package | [`src/shared`](src/shared/README.md) | `@foodize/shared` — platform-agnostic React/TS logic reused by the clients |
| Telegram bot | [`src/telegram-bot`](src/telegram-bot/README.md) | aiogram 3, Python 3.13, aio-pika, Redis |
| Telegram Mini App | [`src/telegram-miniapp`](src/telegram-miniapp/README.md) | React 19, Vite, TypeScript, Telegram WebApp SDK |
| Mobile app | [`src/mobile`](src/mobile/README.md) | React Native, Expo SDK 53, expo-router, React 19 |

The web frontend, Mini App, and mobile app share their domain logic (stores, services,
hooks, i18n, types, utils, components) through `@foodize/shared`. Each app injects its
platform-specific implementations via the `.instance` pattern — see the
[shared README](src/shared/README.md) for the full architecture.

## AI assistants

Two agents for two roles, both responding with streaming (token by token):

| Agent | For | What it does |
|---|---|---|
| **Order Agent** | customer | finds dishes (RAG menu search), builds the cart, and places the order — via tools, with confirmation before checkout |
| **Business Advisor** | venue owner | analyzes sales, peak hours, top/bottom items, revenue by category and reviews, and gives concrete recommendations; includes a proactive breakdown cached for 24 hours |

**Provider-agnostic LLM layer.** One contract, several providers, switchable with a
single environment variable (`LLM__PROVIDER`) without changing agent code:

- Anthropic (Claude) — direct integration;
- GigaChat (Sber) and OpenAI / OpenRouter — via an OpenAI-compatible endpoint;
- Ollama — local inference.

**Tool-calling.** A single agent loop ([`infra/llm/agent.py`](src/backend/infra/llm/agent.py))
executes tool calls (function calling) on the server: the model passes only identifiers
and parameters, while prices, availability, and permissions (`user_id` / `vendor_id`)
are validated on the backend — the model never touches the database directly.

**RAG menu search** ([`ai_order_agent/search.py`](src/backend/features/ai_order_agent/search.py)):
SQL prefilter of available items → embeddings of the query and candidates (bge-m3) →
cosine similarity → hybrid re-rank → top-k, with an embedding cache in Redis. If
embeddings are unavailable, it automatically falls back to keyword search.

**Prompt engineering.** System prompts and scenarios are defined in each agent's
`service.py`: rules, response format, mandatory confirmation before placing an order,
empty-result handling, and input hardening (message-role whitelist, length and history
limits).

Code: [`infra/llm/`](src/backend/infra/llm/),
[`features/ai_order_agent/`](src/backend/features/ai_order_agent/),
[`features/ai_advisor/`](src/backend/features/ai_advisor/);
configuration — [`settings/config/runtime/llm.py`](src/backend/settings/config/runtime/llm.py);
tests — [`tests/unit/ai/`](src/backend/tests/unit/ai/).

## Tech stack

- **AI:** provider-agnostic LLM layer (Anthropic / GigaChat / OpenAI-compatible /
  Ollama), function calling, RAG (embeddings + Redis cache), prompt engineering.
- **Backend:** Python, FastAPI, SQLAlchemy (async), Alembic, PostgreSQL, Redis, RabbitMQ.
- **Frontend:** React, Vite, Zustand, Axios.
- **Telegram:** Mini App (React + WebApp SDK), bot (aiogram).
- **Mobile:** React Native, Expo SDK 53, expo-router.
- **Infrastructure:** Docker Compose, Prometheus, Grafana; CI with ruff, mypy, pytest,
  vitest.

## Architecture

- The backend is organized by feature: `src/backend/features/*`; infrastructure layers
  live in `src/backend/infra/*` (`llm`, `cache`, `messaging`, `storage`).
- JWT authentication (RSA keys), role-based access control (RBAC).
- Realtime (orders, notifications, display board) over WebSocket.
- Reliable event delivery via an **Outbox** (the `outbox_events` table + a worker) so
  notifications are not lost when the broker is unavailable.
- Order-creation idempotency via the `Idempotency-Key` header.
- The backend is the source of truth for the API contract; `make openapi` exports the
  schema and regenerates the shared TypeScript types (`src/shared/types/api.ts`) that the
  web frontend and the Mini App both consume.

## Quick start (Docker)

```bash
cp .env.example .env   # fill in values (at least the LLM provider, see below)
make keys              # RSA keys for JWT → src/backend/certs
make up                # bring up the whole stack
make seed              # seed demo data (restaurants, menus, users)
```

Local services:

- Backend API + Swagger: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`
- Frontend: `http://localhost:5173`
- Telegram Mini App (dev): `http://localhost:5174`
- RabbitMQ UI: `http://localhost:15672`

### LLM configuration in `.env`

```env
# Choose ONE provider
LLM__PROVIDER=openai
LLM__OPENAI_API_KEY=sk-or-...
LLM__OPENAI_BASE_URL=https://openrouter.ai/api/v1
LLM__OPENAI_MODEL=openai/gpt-4o-mini

# Anthropic:  LLM__PROVIDER=anthropic, LLM__ANTHROPIC_API_KEY=sk-ant-...
# GigaChat:   LLM__PROVIDER=gigachat,  LLM__GIGACHAT_API_KEY=<token>
# Ollama:     LLM__PROVIDER=ollama,    LLM__OLLAMA_MODEL=qwen2.5

# Embeddings for RAG search (local Ollama bge-m3). If unavailable,
# search automatically degrades to keyword mode.
LLM__EMBEDDINGS_ENABLED=true
LLM__EMBEDDING_BASE_URL=http://localhost:11434/v1
LLM__EMBEDDING_MODEL=bge-m3
```

> The model must support tool calling (function calling) — both agents rely on it.

Try the agents: Swagger at `http://localhost:8000/docs` →
`POST /api/v1/ai/order/chat` and `POST /api/v1/ai/advisor/chat`, or the assistant button
in the web UI.

## Development commands

```bash
make sync      # install dependencies (all six services)
make lint      # backend (pre-commit + mypy), bot (mypy), and eslint + typecheck for shared, frontend, miniapp, mobile
make test      # pytest (backend, bot) + vitest (shared, frontend, miniapp) + jest (mobile)
make openapi   # export the OpenAPI schema and regenerate typed clients
make up / down / logs   # container management
make seed      # demo data
```

`make sync`, `make lint`, and `make test` cover all six services (backend, bot, shared,
frontend, miniapp, mobile). CI in `.github/workflows/ci.yml` runs a job per service, and
the pre-commit hooks cover every service.

Backend only:

```bash
cd src/backend
uv run pytest
uv run ruff check .
uv run mypy .
uv run alembic upgrade head
```

## Telegram

The Mini App authenticates the user by validating `initData` on the backend. The bot
links Telegram to a Foodize account by phone number. For local testing with a public
HTTPS URL, use `make tg` (it brings up the services and exposes the Mini App through
ngrok).

Required values in `.env`: `BOT_TOKEN`, `TELEGRAM__BOT_API_SECRET`, `MINI_APP_URL`,
`BOT_MODE=polling` (locally).

## Mobile

The React Native app (Expo SDK 53) reuses the shared domain logic and adds a native UI.
It authenticates with a Bearer token stored in `expo-secure-store`. See
[`src/mobile/README.md`](src/mobile/README.md) for setup and current limitations.

## Backup and monitoring

```bash
make backup                 # PostgreSQL dump
make restore FILE=dump.sql  # restore

docker compose -f docker-compose.monitoring.yml up -d   # Prometheus + Grafana
```

## Deployment

See [DEPLOY.md](DEPLOY.md) for production deployment; the roadmap lives in
[IDEAS.md](IDEAS.md).

## License

MIT — see [LICENSE](LICENSE).
