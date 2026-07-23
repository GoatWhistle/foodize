# Foodize Backend

The Foodize API: a FastAPI service that owns the domain (users, restaurants, menus,
carts, orders, reviews, loyalty, staff, admin), the realtime layer (WebSockets), the two
conversational AI agents, and the OpenAPI contract that the web and Telegram Mini App
clients are generated from.

## Tech stack

- Python 3.13
- FastAPI + Uvicorn / Gunicorn
- SQLAlchemy 2 (async) + asyncpg, PostgreSQL, `pgvector`
- Alembic — migrations
- Redis — cache and rate limiting
- RabbitMQ via `aio-pika` — messaging / outbox delivery
- Pydantic 2 — settings and schemas
- PyJWT + cryptography — JWT auth signed with RSA keys
- boto3 / Pillow — media storage and image handling
- `anthropic` + `openai` SDKs — provider-agnostic LLM layer (`infra/llm`)
- Observability: `structlog`, `sentry-sdk`, `prometheus-fastapi-instrumentator`
- Tooling: `uv`, `pytest` (+ `pytest-asyncio`, `pytest-cov`), `mypy` (strict), `ruff`,
  `black`, `pre-commit`
- License: MIT

## Prerequisites

- Python 3.13+
- [`uv`](https://docs.astral.sh/uv/) for dependency management
- A running PostgreSQL, Redis, and RabbitMQ (provided by the repo `docker-compose.yaml`)
- RSA keys for JWT auth (`make keys` from the repo root writes them to `certs/`)

## Getting started

The supported path is the repo-root Docker stack (`make up`), which starts the backend
together with its dependencies. To run the backend directly against those services:

```bash
uv sync                        # install dependencies into .venv
uv run alembic upgrade head    # apply migrations
uv run uvicorn main:app --reload --port 8000
```

With the stack running:

- API docs (Swagger): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

Configuration is read from environment variables / `.env` (see the root
`.env.example`); LLM provider selection is driven by `LLM__PROVIDER` and related keys.

## Commands

```bash
uv sync                                  # install dependencies
uv run pytest                            # run tests
uv run pytest --cov=. --cov-report=term-missing   # tests with coverage (fail_under=85)
uv run mypy .                            # strict type check
uv run ruff check .                      # lint
uv run black .                           # format
uv run pre-commit run --all-files        # full pre-commit suite
uv run alembic upgrade head              # apply migrations
uv run alembic revision --autogenerate -m "message"   # create a migration
```

From the repo root, `make lint` and `make test` include this service, and `make openapi`
exports the schema (see below).

## OpenAPI

The backend is the source of truth for the API contract. The schema is exported to
`openapi/foodize.openapi.json` at the repo root via `tools/export_openapi.py`
(`make openapi`), and the TypeScript clients consume it. The `frontend` package
regenerates its types from that file with `npm run api:types`.

## Project structure

| Path | Contents |
|---|---|
| `main.py` | ASGI app entry point |
| `api/` | Router aggregation — `v1/` mounts every feature router; `system.py` (health), `exception_handlers.py` |
| `features/` | Feature modules, each self-contained (API routers, CRUD, services, schemas, models) |
| `infra/` | Infrastructure layers: `llm/` (provider-agnostic agent + clients), `cache/`, `messaging/`, `storage/` |
| `shared/` | Cross-feature building blocks: dependencies, permissions (RBAC), enums, i18n, schemas, response helpers, WebSocket, sanitization, uploads |
| `settings/` | Layered configuration (`settings/config/...`) |
| `middlewares/` | Request middleware: CSRF, rate limiter, security headers, request id, cache |
| `startup/` | Lifespan, startup guards, middleware wiring |
| `worker/` | Background worker entry point (outbox / event processing) |
| `database/` | Engine, session, base types |
| `alembic/` | Migration environment and `versions/` |
| `tests/` | `pytest` suite (unit + integration), including `tests/unit/ai/` |
| `certs/` | RSA keys for JWT (generated, not committed) |

### Features

`features/` contains: `admin`, `ai_advisor`, `ai_order_agent`, `auth`, `cart`,
`favorites`, `loyalty`, `media`, `menu`, `notifications`, `orders`, `promos`,
`restaurants`, `reviews`, `staff`, `telegram`, `users`, `vendors`. Each exposes an
`APIRouter` that `api/v1/__init__.py` mounts under the versioned prefix. The
notifications feature also registers a WebSocket router.

### AI agents

Two conversational agents are implemented on top of `infra/llm/` (a provider-agnostic
LLM layer with a single tool-calling agent loop, supporting Anthropic, OpenAI-compatible
endpoints, and Ollama):

- `features/ai_order_agent/` — customer order assistant with RAG menu search
  (`search.py`: SQL prefilter → embeddings → cosine similarity → hybrid re-rank, with a
  keyword fallback when embeddings are unavailable).
- `features/ai_advisor/` — business analytics advisor for venue owners.

See the [root README](../../README.md) for the full AI design and configuration
(`settings/config/runtime/llm.py`).

## Linting & testing

- `ruff` and `black` are enforced through `pre-commit`; `mypy` runs in `strict` mode.
- `pytest` uses `asyncio_mode = "auto"`; coverage `fail_under` is 85%.
- Tests live under `tests/` with `pythonpath` including the project root and `tests`.

## Monorepo

See the [root README](../../README.md) for the full architecture, the Docker quick
start, and the shared reuse model.
