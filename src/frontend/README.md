# Foodize Frontend

The Foodize web application: the browser client for customers, vendors, staff, and
admins. It is a React 19 + Vite single-page app that assembles its UI on top of the
platform-agnostic [`@foodize/shared`](../shared/README.md) package.

## Tech stack

- React 19 + React DOM
- Vite 7 (dev server + build)
- TypeScript 5 (strict)
- React Router 7
- Zustand 5 — state (via `@foodize/shared`)
- Axios — HTTP client
- Recharts — analytics charts; `qrcode`; `@phosphor-icons/react`
- Vitest + Testing Library — tests
- ESLint (flat config) with the shared strict preset

## Prerequisites

- Node.js 20+
- npm
- A running backend API (the repo `docker-compose.yaml` proxies `/api` to the backend;
  in dev the Vite proxy targets `http://backend:8000`)

## Getting started

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5173
```

Within the Docker stack the frontend is available at `http://localhost:5173` and its
`/api` requests are proxied to the backend.

## Available scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Start the dev server (port 5173) |
| `build` | `tsc --noEmit && vite build` | Type-check then production build |
| `preview` | `vite preview` | Preview the production build |
| `typecheck` | `tsc --noEmit` | Type-check only |
| `lint` | `eslint .` | Lint with the shared preset |
| `test` | `vitest` | Run tests (watch) |
| `test:coverage` | `vitest run --coverage` | Run tests once with coverage (85% thresholds) |
| `test:ru` | `vitest run --config vitest.ru.config.ts` | Run the RU-locale test config |
| `api:types` | `openapi-typescript ../../openapi/foodize.openapi.json -o ../shared/types/api.ts` | Regenerate the typed API models from the OpenAPI schema into `@shared/types/api.ts` |

## Project structure

| Path | Contents |
|---|---|
| `src/main.tsx` | App bootstrap |
| `src/App.tsx`, `src/AppGuards.tsx`, `src/appRouter.tsx` | Root app shell, route guards, router |
| `src/pages/` | Page components |
| `src/components/` | App-specific components |
| `src/hooks/` | App-specific hooks |
| `src/store/` | Platform store implementations injected into shared (auth, cart, orders) |
| `src/services/` | Platform API client (`api.ts`) injected into shared |
| `src/config.ts`, `src/constants/`, `src/styles/`, `src/utils/`, `src/types/` | App config, constants, styles, utilities, types |
| `src/__tests__/` | Test setup and tests |
| `nginx/` | Production nginx config; `Dockerfile` / `Dockerfile.prod` |

## Reusing `@foodize/shared`

Business logic — stores, services, hooks, i18n, domain types, and presentational
components — lives in [`@foodize/shared`](../shared/README.md), aliased here as
`@shared/*`. The frontend provides only the web-specific glue.

### The `.instance` pattern

Shared modules that need a platform implementation import `.instance` placeholders; this
app rebinds them via `resolve.alias` in `vite.config.ts`:

| Shared placeholder | Frontend implementation |
|---|---|
| `@shared/services/api.instance` | `src/services/api` |
| `@shared/store/useAuthStore.instance` | `src/store/useAuthStore` |
| `@shared/store/useCartStore.instance` | `src/store/useCartStore` |
| `@shared/store/useOrdersStore.instance` | `src/store/useOrdersStore` |

The web API client uses cookie-based auth. Application code imports its concrete stores
from `src/store/...`, while shared code reaches them through the aliased `.instance`
specifiers. See the [shared README](../shared/README.md) for the full explanation.

## Linting & testing

- ESLint uses `reactWebConfig` from the shared preset
  (`import { reactWebConfig } from "../shared/eslint.preset.js"` in `eslint.config.js`) —
  `strictTypeChecked` plus the shared strict rule set.
- Vitest runs in a `jsdom` environment with per-file 85% coverage thresholds across
  store, utils, services, components, pages, and hooks.

```bash
npm run lint
npm run typecheck
npm run test:coverage
```

## Monorepo

See the [root README](../../README.md) for the full architecture and the Docker quick
start.
