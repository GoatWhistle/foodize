<h1 align="center">Foodize</h1>

<p align="center">
  <strong>Order ahead, skip the line.</strong><br/>
  A food pre-ordering platform where guests pick up at a time they choose — and venues run the whole kitchen queue from one screen.
</p>

<p align="center">
  <a href="#how-it-works">How it works</a>
  &nbsp;·&nbsp;
  <a href="#ai-assistants">AI assistants</a>
  &nbsp;·&nbsp;
  <a href="#run-locally">Run locally</a>
  &nbsp;·&nbsp;
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img alt="MIT" src="https://img.shields.io/badge/license-MIT-17191d?style=flat-square"/>
  <img alt="Python" src="https://img.shields.io/badge/python-3.13-3776ab?style=flat-square"/>
  <img alt="React" src="https://img.shields.io/badge/react-19-61dafb?style=flat-square"/>
  <img alt="Clients" src="https://img.shields.io/badge/clients-web_·_telegram_·_mobile-e8562a?style=flat-square"/>
</p>

## The problem

Lunch queues waste the two things nobody has: the guest's break and the venue's peak hour. Ordering apps solved delivery, not pickup — the guest still arrives to wait, and the kitchen still cooks blind, guessing what walks through the door next.

Foodize moves the order before the arrival. A guest picks a dish and a pickup time; the kitchen sees the queue ahead of it and cooks against a schedule instead of a doorbell.

## Product

**For guests.** Browse venues and menus, build a cart with options and modifiers, apply promo codes, and choose a pickup time. Order status arrives live over WebSocket, through Telegram, or as a native push. Favorites, reviews and ratings included — or skip the UI entirely and let the AI assistant assemble the order in chat.

**For venues.** Manage menus, categories, options and availability. Watch a real-time feed of incoming orders and move them through statuses. Read financial analytics and sales breakdowns, export to CSV or PDF, and manage staff with scoped permissions. An AI advisor reads the numbers and answers questions about them.

**For staff and admins.** A pickup display board for counter staff. An admin panel for venue and vendor moderation, users, RBAC, platform statistics, exports and an action audit log.

**Four ways in.** Web app, Telegram Mini App, Telegram bot, and a native iOS/Android app — all on one backend, sharing one domain layer.

## How it works

1. **Discover** — the guest browses venues and menus, or describes what they want to the order assistant.
2. **Build** — items, options and modifiers land in a cart; promo codes and loyalty apply at checkout.
3. **Schedule** — the guest picks a pickup time instead of waiting for a courier.
4. **Confirm** — the order is created idempotently (`Idempotency-Key`) and lands in the venue's live feed.
5. **Cook** — the kitchen advances statuses; every transition is published through an outbox so no notification is lost.
6. **Notify** — the guest sees the change over WebSocket, in Telegram, and as a native push.
7. **Pick up** — the display board calls the order at the counter; the guest walks past the queue.
8. **Learn** — sales, peak hours and reviews feed the venue's AI advisor for the next day.

## AI assistants

Two agents for two roles, both streaming token by token.

| Agent | For | What it does |
|---|---|---|
| **Order Agent** | guest | Finds dishes via RAG menu search, builds the cart and places the order through tools — always confirming before checkout |
| **Business Advisor** | venue owner | Analyzes sales, peak hours, top and bottom items, revenue by category and reviews, then gives concrete recommendations; ships a proactive daily breakdown cached for 24 hours |

**The model proposes; the backend decides.** A single agent loop ([`infra/llm/agent.py`](src/backend/infra/llm/agent.py)) executes tool calls server-side. The model passes identifiers and parameters only — prices, availability and permissions (`user_id` / `vendor_id`) are validated on the backend, and the model never touches the database.

**Provider-agnostic.** One contract, four providers, switched by a single environment variable (`LLM__PROVIDER`) with no change to agent code: Anthropic (direct), GigaChat and OpenAI/OpenRouter (OpenAI-compatible endpoint), and Ollama for local inference.

**RAG menu search** ([`ai_order_agent/search.py`](src/backend/features/ai_order_agent/search.py)): SQL prefilter over available items → embeddings of query and candidates (bge-m3) → cosine similarity → hybrid re-rank → top-k, with an embedding cache in Redis. If embeddings are unavailable, search degrades to keyword mode automatically.

## Architecture

```mermaid
flowchart LR
    Web[Web app] --> API
    Mini[Telegram Mini App] --> API
    Mobile[Mobile app] --> API
    Bot[Telegram bot] --> API
    API[FastAPI backend] --> PG[(PostgreSQL)]
    API --> Redis[(Redis)]
    API --> Outbox[Outbox table]
    Outbox --> Worker[Notification worker]
    Worker --> MQ[(RabbitMQ)]
    MQ --> Bot
    API -.WebSocket.-> Web
    API --> LLM{LLM provider}
    Shared[[@foodize/shared]] -.domain logic.- Web
    Shared -.domain logic.- Mini
    Shared -.domain logic.- Mobile
```

- **Feature-sliced backend.** Domain code lives in `src/backend/features/*`; infrastructure in `src/backend/infra/*` (`llm`, `cache`, `messaging`, `storage`).
- **One domain layer, four clients.** Web, Mini App and mobile share stores, services, hooks, i18n, types and utils through `@foodize/shared`, injecting platform specifics via the `.instance` pattern — see the [shared README](src/shared/README.md).
- **Reliable events.** An outbox table plus a worker guarantee delivery when the broker is down; order creation is idempotent by header.
- **One source of truth for the API.** `make openapi` exports the schema from the backend and regenerates the shared TypeScript types both web clients consume.
- **Security.** JWT on RSA keys, role-based access control, `initData` validation for the Mini App, and secure-store token handling on mobile.

## Services

Six services under `src/`, each with its own README:

| Service | Path | Stack |
|---|---|---|
| Backend API | [`src/backend`](src/backend/README.md) | FastAPI, Python 3.13, SQLAlchemy (async), Alembic, PostgreSQL, Redis, RabbitMQ |
| Web frontend | [`src/frontend`](src/frontend/README.md) | React 19, Vite, TypeScript, Zustand, Axios |
| Shared package | [`src/shared`](src/shared/README.md) | `@foodize/shared` — platform-agnostic React/TS domain logic |
| Telegram bot | [`src/telegram-bot`](src/telegram-bot/README.md) | aiogram 3, Python 3.13, aio-pika, Redis |
| Telegram Mini App | [`src/telegram-miniapp`](src/telegram-miniapp/README.md) | React 19, Vite, TypeScript, Telegram WebApp SDK |
| Mobile app | [`src/mobile`](src/mobile/README.md) | React Native, Expo SDK 53, expo-router, React 19 |

## Run locally

Requirements: Docker and Docker Compose, plus credentials for one LLM provider.

```bash
cp .env.example .env   # fill in values — at minimum an LLM provider
make keys              # RSA keys for JWT → src/backend/certs
make up                # bring up the whole stack
make seed              # demo venues, menus and users
```

| Service | URL |
|---|---|
| Backend API + Swagger | `http://localhost:8000/docs` |
| Health check | `http://localhost:8000/api/health` |
| Web frontend | `http://localhost:5173` |
| Telegram Mini App (dev) | `http://localhost:5174` |
| RabbitMQ UI | `http://localhost:15672` |

### LLM configuration

```env
# Choose ONE provider
LLM__PROVIDER=openai
LLM__OPENAI_API_KEY=sk-or-...
LLM__OPENAI_BASE_URL=https://openrouter.ai/api/v1
LLM__OPENAI_MODEL=openai/gpt-4o-mini

# Anthropic:  LLM__PROVIDER=anthropic, LLM__ANTHROPIC_API_KEY=sk-ant-...
# GigaChat:   LLM__PROVIDER=gigachat,  LLM__GIGACHAT_API_KEY=<token>
# Ollama:     LLM__PROVIDER=ollama,    LLM__OLLAMA_MODEL=qwen2.5

# Embeddings for RAG search (local Ollama bge-m3).
# If unavailable, search degrades to keyword mode.
LLM__EMBEDDINGS_ENABLED=true
LLM__EMBEDDING_BASE_URL=http://localhost:11434/v1
LLM__EMBEDDING_MODEL=bge-m3
```

> The model must support tool calling — both agents depend on it.

Try the agents in Swagger via `POST /api/v1/ai/order/chat` and `POST /api/v1/ai/advisor/chat`, or from the assistant button in the web UI.

### Telegram

The Mini App authenticates by validating `initData` on the backend; the bot links a Telegram account to a Foodize account by phone number. For local testing behind a public HTTPS URL, `make tg` brings up the stack and exposes the Mini App through ngrok.

Required in `.env`: `BOT_TOKEN`, `TELEGRAM__BOT_API_SECRET`, `MINI_APP_URL`, `BOT_MODE=polling`.

## Development

```bash
make sync      # install dependencies for all six services
make lint      # pre-commit + mypy (backend, bot), eslint + typecheck (shared, frontend, miniapp, mobile)
make test      # pytest (backend, bot), vitest (shared, frontend, miniapp), jest (mobile)
make openapi   # export the OpenAPI schema and regenerate typed clients
make up / down / logs
make seed
make backup                 # PostgreSQL dump
make restore FILE=dump.sql
```

CI in `.github/workflows/ci.yml` runs a job per service; pre-commit hooks cover all six. Every client package enforces a coverage threshold, and the mobile app gates at 90%.

Backend only:

```bash
cd src/backend
uv run pytest
uv run ruff check .
uv run mypy .
uv run alembic upgrade head
```

Monitoring:

```bash
docker compose -f docker-compose.monitoring.yml up -d   # Prometheus + Grafana
```

## Repository layout

```text
src/
├── backend/           FastAPI API, feature-sliced domain, LLM agents
├── frontend/          React web app
├── shared/            @foodize/shared — domain logic for every client
├── telegram-bot/      aiogram bot
├── telegram-miniapp/  Telegram Mini App
└── mobile/            React Native app (Expo)

deploy/                nginx and production service definitions
openapi/               exported API contract
tools/                 backup, restore and maintenance scripts
```

## License

Foodize is released under the [MIT License](LICENSE).
