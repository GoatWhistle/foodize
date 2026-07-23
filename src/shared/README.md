# @foodize/shared

Platform-agnostic React/TypeScript package that holds the business logic shared by
every Foodize client — the web frontend, the Telegram Mini App, and the React Native
mobile app. It contains the state stores, API/service layer, hooks, i18n, types,
utilities, and presentational components, so that each app assembles a UI on top of a
single source of truth instead of reimplementing domain logic.

This README is the reference for the cross-app reuse architecture. The other service
READMEs link back here.

## Tech stack

- TypeScript (strict, `strictTypeChecked` ESLint preset)
- React 19 (peer / dev dependency — the package ships no React runtime of its own)
- Zustand 5 — state stores
- Axios — HTTP client contract (the concrete instance is injected per app, see below)
- Vitest + Testing Library — unit tests
- `@phosphor-icons/react` — icons used by shared components

The package is `private` and consumed by path (`file:../shared`) / path alias, not
published to a registry.

## Prerequisites

- Node.js 20+
- npm

Because it is consumed as source (not a build artifact), there is no build step — each
consuming app compiles the shared TypeScript through its own bundler (Vite / Metro).

## Getting started

```bash
npm install
npm run typecheck
npm run test
```

You normally do not run this package on its own; it is pulled in by the apps that
depend on it. From the repo root, `make sync` installs it together with the other
services.

## Available scripts

| Script | Command | Purpose |
|---|---|---|
| `typecheck` | `tsc --noEmit` | Type-check the package |
| `lint` | `eslint .` | Lint with the shared preset |
| `test` | `vitest` | Run unit tests (watch) |
| `test:coverage` | `vitest run --coverage` | Run tests once with coverage |

## Layers

| Directory | Contents |
|---|---|
| `store/` | Zustand store factories (`create*Store.ts`) and app-facing stores — auth, cart, orders, notifications, favorites, restaurant, theme, language, modal |
| `services/` | API client factory, domain services (auth, cart, menu, orders, promos, reviews, favorites, loyalty, staff, users, vendors, notifications), streaming/SSE helpers, reliable WebSocket, cookie refresh |
| `hooks/` | Reusable page/logic hooks (home, orders, profile, restaurant, favorites) and utility hooks (infinite list, focus trap, order WebSocket, ETA text, dialog keyboard, theme) |
| `i18n/` | Translation engine (`translate.ts`, `useTranslation.ts`, `types.ts`) and `dictionaries/{ru,en}` |
| `types/` | Domain models (`models.ts`), generated OpenAPI types (`api.ts`), ambient declarations (Telegram, assets) |
| `utils/` | Pure helpers — price/date formatting, pluralization, permissions, order status, phone, a11y, TTL cache, API error translation, etc. |
| `components/` | Presentational React components (cards, drawers, dialogs, badges, switchers, logo, empty/error states, pagination) |
| `constants/` | Shared formatting constants |

`components/index.ts`, `hooks/index.ts`, and the dictionary `index.ts` files are the
public entry points for their layers.

## The `.instance` injection pattern

Some shared modules need a platform-specific implementation: the HTTP client is created
differently on web (cookies) vs. mobile (Bearer token + secure storage), and the auth,
cart, and orders stores are wired to those platform clients. To keep the shared code
platform-agnostic, it imports a placeholder module whose name ends in `.instance`, and
each app rebinds that import to its own implementation through its bundler.

Placeholders live in this package:

- `services/api.instance.ts`
- `store/useAuthStore.instance.ts`
- `store/useCartStore.instance.ts`
- `store/useOrdersStore.instance.ts`

Each placeholder is a guard that throws if it is imported without being aliased — for
example `services/api.instance.ts` returns a `Proxy` that raises
`"@shared/services/api.instance must be aliased by the consuming app"`. That turns a
missing alias into an immediate, explicit error instead of a silent runtime failure.

Each app maps the `.instance` specifiers to its own files:

| Consumer | Mechanism | Where |
|---|---|---|
| `frontend` | Vite `resolve.alias` | `src/frontend/vite.config.ts` |
| `telegram-miniapp` | Vite `resolve.alias` + tsconfig `paths` | `src/telegram-miniapp/vite.config.ts`, `tsconfig.json` |
| `mobile` | Metro `resolver.resolveRequest` (`INSTANCE_OVERRIDES`) | `src/mobile/metro.config.js` |

For example, every app points `@shared/services/api.instance` at its own
`src/services/api(.ts)`. Application code therefore imports its concrete stores from its
local path (e.g. `@/store/useAuthStore`), while shared modules import the platform store
through `@shared/store/useAuthStore.instance` and receive the injected implementation.

## The `@shared` alias

All apps expose the package root as the `@shared/*` alias:

- `frontend` / `telegram-miniapp` — Vite alias + tsconfig `paths`
- `mobile` — tsconfig `paths` + Babel `module-resolver` (`@shared` → `../shared`) and
  Metro `resolveRequest`

Shared code refers to itself with `@shared/...` too (e.g.
`import ... from "@shared/i18n/types"`).

## Shared ESLint preset

`eslint.preset.js` is the single strict ESLint configuration for the web-oriented
packages. It exports:

- `sharedRules` — the strict rule set (`no-explicit-any`, `no-floating-promises`,
  `no-misused-promises`, `await-thenable`, `no-non-null-assertion`, `no-deprecated`,
  restricted template expressions, `no-console` except `warn`/`error`, and the React /
  React-Hooks rules).
- `reactWebConfig({ rootDir, ignores })` — a full flat-config builder layering
  `@eslint/js` recommended, `typescript-eslint` `strictTypeChecked`, Prettier, and
  `sharedRules`.

`shared`, `frontend`, and `telegram-miniapp` all import `reactWebConfig` from this file
(`import { reactWebConfig } from "../shared/eslint.preset.js"`). The `mobile` app uses
`eslint-config-expo` plus the same strict `@typescript-eslint` rules, since its runtime
globals differ from the browser.

## i18n

- Dictionaries are split by locale under `i18n/dictionaries/{ru,en}` and grouped by
  domain (`common`, `auth`, `catalog`, `order`, `profile`, `vendor`, `admin`, `staff`,
  `loyalty`, `notifications`, `legal`, `apiErrors`, `enums`).
- `translate.ts` exposes the `t()` lookup; `useTranslation.ts` is the React hook.
- Supported languages are `ru` and `en` with pluralization support; `types.ts` defines
  `Language`, `DEFAULT_LANGUAGE`, `SUPPORTED_LANGUAGES`, and the `isLanguage` guard.
- `store/useLanguageStore.ts` detects the initial language (Telegram `initData`
  language, then `navigator.language`) and persists the choice via Zustand `persist`.

## Linting & testing

```bash
npm run lint        # eslint . using the shared preset
npm run typecheck   # tsc --noEmit
npm run test        # vitest (watch)
npm run test:coverage
```

Stores, services, utils, hooks, and components are covered by co-located `*.test.ts(x)`
files. From the repo root, `make lint` and `make test` run this package along with the
other five services.

## Monorepo

See the [root README](../../README.md) for the full Foodize architecture and the Docker
quick start.
