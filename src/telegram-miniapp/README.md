# Foodize Telegram Mini App

The Foodize client that runs inside Telegram as a Mini App. It is a React 19 + Vite
single-page app that authenticates through Telegram `initData` and, like the web
frontend, builds its UI on top of the platform-agnostic
[`@foodize/shared`](../shared/README.md) package.

## Tech stack

- React 19 + React DOM
- Vite 7 (dev server + build)
- TypeScript 5 (strict)
- React Router 7
- Zustand 5 — state (via `@foodize/shared`)
- Axios — HTTP client
- `@phosphor-icons/react` — icons
- Telegram WebApp SDK integration (`src/telegram/`)
- Vitest + Testing Library — tests
- ESLint (flat config) with the shared strict preset

## Prerequisites

- Node.js 20+
- npm
- A running backend API (the Vite dev proxy targets `http://backend:8000`, `/api`)
- For a real Telegram client you need a public HTTPS URL; the repo `make tg` target runs
  the stack and exposes the Mini App through ngrok

## Getting started

```bash
npm install
npm run dev        # Vite dev server on http://localhost:5174
```

Within the Docker stack the Mini App dev server is available at `http://localhost:5174`.
The Vite config allows `.ngrok-free.dev` hosts for testing inside Telegram.

## Available scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `vite` | Start the dev server (port 5174) |
| `build` | `tsc --noEmit && vite build` | Type-check then production build |
| `preview` | `vite preview` | Preview the production build |
| `typecheck` | `tsc --noEmit` | Type-check only |
| `lint` | `eslint .` | Lint with the shared preset |
| `test` | `vitest` | Run tests (watch) |
| `test:coverage` | `vitest run --coverage` | Run tests once with coverage (85% thresholds) |

The typed API models are generated from the OpenAPI schema into `@shared/types/api.ts`
(by the `frontend` package's `api:types` script / `make openapi`); the Mini App consumes
those shared types directly and has no generation script of its own.

## Project structure

| Path | Contents |
|---|---|
| `src/main.tsx` | App bootstrap |
| `src/App.tsx`, `src/routes.tsx` | Root app shell and routes |
| `src/telegram/` | Telegram WebApp SDK wiring: `sdk.ts`, `init.ts`, `bootFlow.ts` |
| `src/pages/` | Pages: `auth`, `home`, `restaurant`, `orders`, `notifications`, `profile`, `legal` |
| `src/components/` | App-specific components |
| `src/hooks/` | App-specific hooks |
| `src/store/` | Platform store implementations injected into shared (auth, cart, orders, notifications) |
| `src/services/` | Platform API client (`api.ts`) and `authService.ts` |
| `src/styles/`, `src/index.css` | Styles |
| `nginx/` | Production nginx config; `Dockerfile` / `Dockerfile.prod` |

## Reusing `@foodize/shared`

Stores, services, hooks, i18n, domain types, and presentational components come from
[`@foodize/shared`](../shared/README.md), aliased here as `@shared/*` (Vite alias +
tsconfig `paths`). The Mini App adds only the Telegram-specific glue (SDK boot flow,
`initData` auth).

### The `.instance` pattern

Shared modules that need a platform implementation import `.instance` placeholders,
rebound here through both `resolve.alias` in `vite.config.ts` and `paths` in
`tsconfig.json`:

| Shared placeholder | Mini App implementation |
|---|---|
| `@shared/services/api.instance` | `src/services/api.ts` |
| `@shared/store/useAuthStore.instance` | `src/store/useAuthStore.ts` |
| `@shared/store/useCartStore.instance` | `src/store/useCartStore.ts` |
| `@shared/store/useOrdersStore.instance` | `src/store/useOrdersStore.ts` |

See the [shared README](../shared/README.md) for the full explanation of the injection
pattern.

## Linting & testing

- ESLint uses `reactWebConfig` from the shared preset
  (`import { reactWebConfig } from "../shared/eslint.preset.js"`).
- Vitest runs in a `jsdom` environment with per-file 85% coverage thresholds across
  store, telegram, utils, services, components, pages, hooks, plus `App.tsx` and
  `routes.tsx`.

```bash
npm run lint
npm run typecheck
npm run test:coverage
```

## Monorepo

See the [root README](../../README.md) for the full architecture and the Docker quick
start.
