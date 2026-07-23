# Foodize Mobile

The Foodize mobile app, built with **Expo SDK 53** (expo-router v5, React 19.2.7, React
Native 0.79.5, TypeScript strict). It reuses the business logic from the platform-agnostic
[`@foodize/shared`](../shared/README.md) package and adds a native UI on top.

## Tech stack

- Expo SDK 53 + expo-router v5 (file-based routing in `app/`)
- React 19.2.7 / React Native 0.79.5
- TypeScript 5 (strict)
- Zustand — state (reused from `@foodize/shared`)
- Axios — HTTP client
- `expo-secure-store` — token storage; `@react-native-async-storage/async-storage`
- `react-native-gesture-handler`, `react-native-reanimated`,
  `react-native-safe-area-context`, `react-native-screens`
- Jest + `@testing-library/react-native` — tests
- ESLint with `eslint-config-expo` plus the strict `@typescript-eslint` rules

## Prerequisites

- Node.js 20+
- npm
- Expo tooling (invoked through `npx expo` / the `expo` dependency)
- iOS Simulator (macOS) or Android emulator for device runs
- A running backend API reachable from the device/emulator

## Getting started

```bash
npm install
npm run start      # start Metro / Expo dev server
```

Then open the app in a simulator/emulator or via Expo Go / a dev build.

## Configuration

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` (e.g.
`http://localhost:8000/api/v1`). On a real device or emulator `localhost` does not point
at your machine — use the host's LAN IP.

## Commands

| Script | Command | Purpose |
|---|---|---|
| `start` | `expo start` | Start Metro / Expo dev server |
| `ios` | `expo start --ios` | Run on the iOS simulator |
| `android` | `expo start --android` | Run on the Android emulator |
| `prebuild` | `expo prebuild` | Generate native projects |
| `typecheck` | `tsc --noEmit` | Type-check |
| `lint` | `eslint .` | Lint |
| `test` | `jest` | Run tests |
| `test:coverage` | `jest --coverage` | Run tests with coverage |

From the repo root, `make lint` and `make test` include this service.

## Project structure

| Path | Contents |
|---|---|
| `app/` | expo-router routes: `_layout.tsx` (root layout, token bootstrap) and `index.tsx` |
| `src/screens/` | Screen components |
| `src/components/` | UI primitives (`AppText`, `Screen`) |
| `src/store/` | Platform store implementations injected into shared (`useAuthStore`, `useCartStore`, `useOrdersStore`) |
| `src/services/` | Platform API client (`api.ts`) and `tokenRefresh.ts` |
| `src/platform/` | Native platform code (`tokenStorage.ts`, secure-store backed) |
| `src/i18n/` | Re-exports the shared i18n for the app |
| `src/theme/` | Theme tokens and hooks |
| `src/config/` | `env.ts` (reads `EXPO_PUBLIC_API_URL`) |
| `metro.config.js`, `babel.config.js`, `app.json` | Metro/Babel/Expo config |

## Reusing `@foodize/shared`

`@foodize/shared` is the platform-agnostic TS package (store / services / hooks / i18n /
types / utils / components) shared across web and mobile.

Aliases:

- `@shared/*` → `../shared/*` — shared code. Configured in `tsconfig.json` `paths`,
  `babel.config.js` `module-resolver`, and `metro.config.js` `resolveRequest`.
- `@/*` → `src/*` — this app's own code.

### The `.instance` pattern

Shared modules that require a platform implementation import a `.instance` placeholder
(`@shared/services/api.instance`, `@shared/store/useAuthStore.instance`,
`useCartStore.instance`, `useOrdersStore.instance`). Metro (`metro.config.js`,
`INSTANCE_OVERRIDES`) rebinds them to the mobile implementations:

| Shared placeholder | Mobile implementation |
|---|---|
| `@shared/services/api.instance` | `src/services/api.ts` |
| `@shared/store/useAuthStore.instance` | `src/store/useAuthStore.ts` |
| `@shared/store/useCartStore.instance` | `src/store/useCartStore.ts` |
| `@shared/store/useOrdersStore.instance` | `src/store/useOrdersStore.ts` |

So application code imports its stores as `@/store/useAuthStore`, not from
`@shared/...instance`. See the [shared README](../shared/README.md) for the full pattern.
Note that the `.instance` rebinding is a Metro-only override; `tsconfig.json` and Babel
only define the broad `@shared/*` and `@/*` aliases.

## Linting & testing

```bash
npm run lint
npm run typecheck
npm run test
```

ESLint uses `eslint-config-expo` plus the same strict `@typescript-eslint` rules as the
rest of the monorepo (its runtime globals differ from the browser packages, so it does
not import the web `reactWebConfig` preset).

## Design system

Native, theme-aware UI primitives live in `src/components/ui` (`Button`, `Input`, `Card`,
`Badge`, `Skeleton`, `Divider`, `Chip`, `Avatar`, `Rating`, `IconButton`, `Sheet`,
`EmptyState`, `ErrorState`) and are the building blocks for every screen. They read colors
through `useTheme()` (`src/theme/useTheme.ts`), which resolves light/dark from
`useThemeStore` plus the system scheme. Domain components (`RestaurantCard`,
`MenuItemCard`, `OrderCard`, …) live in `src/components/domain`.

## Screens

`app/` holds only routes; screen implementations live in `src/screens/*` and pull their
logic from `@shared/hooks`. Route groups: `(auth)` (login/register) and `(tabs)`
(Catalog / Orders / Favorites / Profile), with detail routes for restaurant, order status
(live via WebSocket), cart, notifications, settings and legal. `app/(tabs)/_layout.tsx`
guards the authed area and redirects unauthenticated users to `(auth)/login`.

## Native integrations

- **Auth** — Bearer token + refresh in `expo-secure-store`; bootstrapped in
  `app/_layout.tsx`.
- **Language persistence** — resolved. `src/platform/languagePersistence.ts` installs an
  `AsyncStorage`-backed `localStorage` shim and a `navigator.language` value from
  `expo-localization` before the shared `useLanguageStore` initializes, so the choice
  survives restarts without touching shared.
- **Push** — `expo-notifications` (`src/platform/pushNotifications.ts`,
  `src/services/push.ts`) with Android channels, deep-link handling
  (`src/services/deepLinks.ts`) and haptics. The backend device-registration endpoint is
  not yet implemented (see `PLAN.md` §15); the client degrades gracefully until it exists.
- **Observability** — `@sentry/react-native` (`src/services/observability.ts`) plus a
  native `ErrorBoundary`.

## Testing & coverage

Jest is configured with a hard **90% global coverage threshold**
(`jest.config.js` `coverageThreshold`), enforced in CI. `jest.setup.js` mocks the native
modules and maps `react`/`react-dom`/`zustand` to a single instance so shared hooks run
under test. Run `npm run test:coverage`.

## Monorepo

See the [root README](../../README.md) for the full architecture and the Docker quick
start.
