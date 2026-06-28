# Foodize Test Coverage Plan

Goal: make backend and frontend tests reliable first, then raise meaningful code coverage to 90%+ without snapshot noise or brittle UI text checks.

## Current Baseline

Backend:
- Full command used: `uv run pytest -p no:cacheprovider --cov=. --cov-report=term-missing`.
- Current result: `387 passed`, backend test runner is trustworthy again.
- Current coverage: `71%` total after stabilizing old tests and adding the first coverage batch.
- Fixed blockers: SQLite-compatible audit JSON, stale role/user schema tests, stale order status tests, live Redis/DB coupling in unit tests, old promo/menu/restaurant/review expectations, and outdated API patch targets.
- Remaining blocker for 90%: large admin/export/WebSocket/CRUD surfaces still need focused tests.

Frontend:
- Full command used: `npm.cmd run test:coverage -- --run`.
- Current result: `137 passed`, frontend test runner is green.
- Current coverage: `27.26%` total.
- Fixed blockers: stale UI copy expectations, mojibake strings in tests, changed phone normalization, changed vendor approval behavior, and polling assumptions after WebSocket-first order updates.
- Remaining blocker for 90%: broad missing page coverage, especially admin/staff/vendor/profile/restaurant flows and large dashboard components.

Telegram miniapp:
- No test runner or coverage script is configured yet.
- Needs Vitest/Testing Library setup before 90% coverage can be measured.

## Coverage Strategy

Do not chase 90% by testing implementation trivia. Cover public behavior and risky branches:
- API/service contracts and permission boundaries.
- Money, order status, idempotency, promo, cart, and menu option rules.
- Auth token rotation, logout invalidation, refresh fallback, and WebSocket access.
- Restaurant display ID/QR/deep-link routing.
- UI store flows and user-facing flows: auth, restaurant page, cart, checkout, order status, vendor/staff dashboards.

## Order Of Work

### 1. Make Test Runners Trustworthy

Backend:
- [x] Make test DB compatible with models, starting with `AuditLog.details` using SQLite-compatible JSON in tests.
- [x] Replace live Redis coupling in auth/order tests with fake cache fixtures.
- [x] Normalize old exception/assertion expectations to current `SuccessResponse` and app exception payloads.
- [x] Separate true DB tests from mocked API/service tests where old mocks pointed at removed functions.

Frontend:
- [x] Replace mojibake test strings with real UTF-8 text or role/label queries.
- [x] Update tests to current UI: icon-first header, new status copy, phone normalization, vendor approval gating.
- [x] Make timer tests deterministic around WebSocket/polling behavior.

Miniapp:
- Add Vitest, jsdom, Testing Library, coverage script.
- Mirror reusable test utilities from frontend where sensible.

### 2. Backend Domain Coverage

Priority A:
- `features.auth`: login/register/refresh/logout, cookie + bearer paths, refresh replay protection, inactive users.
- `features.orders`: create order, requested pickup time, working hours, idempotency, option validation, status transitions, cancellation/completion, event publishing.
- `features.orders.api.ws`: unauthenticated, invalid token, customer owner, restaurant staff, forbidden user.
- `features.restaurants`: CRUD, display ID collision retry, display ID lookup, working hours.

Priority B:
- `features.menu`: item availability, option groups, required/min/max/single selection.
- `features.cart`: quantity, option identity, restaurant mismatch, unavailable items.
- `features.promos`: date windows, first-order, restaurant scoping, usage limits, discounts.
- `features.staff/vendors/admin`: permission gates, approval flows, audit logging.

Priority C:
- Notifications/outbox/worker behavior with mocked broker/cache.
- Middleware: cache, rate limit wiring, exception handlers.
- Telegram validation/auth paths.

### 3. Frontend Coverage

Priority A:
- API client refresh interceptor, logout behavior, WebSocket URL/token factories.
- Auth store, order store, cart drawer checkout, requested pickup time.
- Order status page with WebSocket updates and fallback behavior.
- QRCode modal: separate site QR and Telegram QR with `display_id`.

Priority B:
- Restaurant page: menu loading, category filtering, product options, cart add.
- Vendor dashboard: approval gate, restaurant creation, QR modal, staff controls.
- Staff dashboard: order status changes and display-board flow.

Priority C:
- Theme/layout/profile polish tests.
- Visual components only where they encode behavior, not pure styling.

### 4. Coverage Gates

After runners are green:
- Backend: add `--cov-fail-under=70`, then 80, then 90 as modules are covered.
- Frontend: add Vitest coverage thresholds at 70/80/90 in stages.
- Miniapp: add the same thresholds after test runner setup.

Final target:
- Backend total coverage: 90%+.
- Frontend total coverage: 90%+.
- Miniapp total coverage: 90%+ after infra exists.
- Critical modules should be higher than total average: auth/orders/payments-like money logic should trend toward 95%+.

## First Implementation Batch

1. [x] Fix backend test DB compatibility for PostgreSQL-specific types.
2. [x] Update the most stale frontend tests so the frontend suite is green again.
3. [partial] Backend tests now cover current auth/orders/promos/menu/restaurants/reviews/status behavior, WebSocket access helpers, display ID generation/lookup, working-hours CRUD, order option validation, outbox publishing, and Telegram site-login basics.
4. [x] Add frontend tests for refresh parsing, WebSocket token URLs, QR display ID links, requested pickup submission, logout API call, favorite/modal stores, debounce, download, confirm dialog, and error boundary.
5. [pending] Add miniapp test runner and first tests for auth refresh/logout plus order WebSocket URL.

## Second Implementation Batch

Completed:
- [x] Backend: `features.orders.api.ws` helper coverage for owner/staff/admin/forbidden paths and display-board grouping.
- [x] Backend: menu option validation for duplicate, required, max, single, foreign, and unavailable option paths.
- [x] Backend: restaurant `display_id` lookup and collision retry.
- [x] Backend: auth refresh/logout API endpoints.
- [x] Backend: notification outbox enqueue, publish success, and retry backoff.
- [x] Backend: Telegram site-login request/verify/password flows.
- [x] Backend: working-hours CRUD and `is_open_now` behavior.
- [x] Frontend: QR modal site/Telegram links through `display_id`.
- [x] Frontend: order store scheduled pickup payload and idempotency header.
- [x] Frontend: API refresh interceptor, error detail normalization, WebSocket token URL factories.
- [x] Frontend: cart drawer scheduled checkout, auth logout POST, Telegram auth store flows.
- [x] Frontend: favorite/modal stores, debounce hook, download util, confirm dialog, error boundary.

Next highest-impact backend targets:
- `features.admin.api`, `features.admin.crud`, `features.admin.export`, `features.admin.service`.
- Real WebSocket endpoint tests for orders/restaurant display-board with mocked pubsub.
- `features.notifications.ws` and `features.notifications.crud`.
- `features.orders.crud.order` DB-level filters and event history.
- `features.telegram.api` endpoint layer and CRUD helpers.

Next highest-impact frontend targets:
- `AdminDashboardPage`, `StaffDashboardPage`, `VendorDashboardPage` deeper tab/action tests.
- `RestaurantPage` reviews/favorites/staff request/info/share flows.
- `OrderDetailsModal`, `NotificationBell`, `ShareModal`, `DisplayBoardPage`.
- `App.jsx` routing/auth bootstrap behavior.

## Latest Verification

- Backend: `uv run pytest -p no:cacheprovider -q` -> `387 passed`.
- Backend coverage: `uv run pytest -p no:cacheprovider --cov=. --cov-report=term-missing -q` -> `71%`.
- Backend ruff: `uv run ruff check tests features/notifications/schemas.py features/telegram/service.py` -> passed.
- Frontend: `npm.cmd test -- --run --reporter=dot` -> `137 passed`.
- Frontend coverage: `npm.cmd run test:coverage -- --run --reporter=dot` -> `137 passed`, `27.26%`.
- Frontend lint: `npm.cmd run lint` -> passed.
