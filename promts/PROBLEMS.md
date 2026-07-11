# PROBLEMS

Оставшиеся задачи после устранения находок аудита. Каждый пункт — либо крупный рефактор с риском, либо требует согласования / продуктового решения / новой инфра-компоненты.

---

## Backend

- **`place_order` — крупная функция.** Декомпозиция по шагам (валидация → создание → промо → события); часть уже вынесена в `_create_order`/`order_utils`. Риск регрессий.
- **HTTP-объекты в сервисном слое auth.** Вынос cookie-логики из `login/logout/refresh` в api-слой ломает сигнатуры и много тестов.

## AI / LLM

- **«Стриминг» без инкрементальности** (`infra/llm/agent.py`): no-tool путь отдаёт финальный ответ одним chunk; истинный стриминг требует детекции `tool_use` по ходу стрима (редизайн agent-loop).

## Database

- **`DeletedAtMixin` у Restaurant** — `get_restaurant_by_id` фильтрует `deleted_at IS NULL`; полное удаление миксина/дроп колонки требует продуктового решения по soft-delete ресторанов.
- **`working_hours.open_time/close_time` как `String(5)`** — переход на `TIME` + CHECK формата/дня недели: большая миграция данных.
- **OFFSET-пагинация повсеместно** — keyset-пагинация как сквозной рефактор crud-слоя.
- **Нет `unique` на `users.telegram_username`** — меняется/nullable; сознательно оставлено (account-linking — отдельная фича).
- **Account-linking (мультиакк)** — связать ТГ-акк и сайт-акк одного пользователя (merge, разрешение конфликтов, UX подтверждения). Отдельная фича; сейчас только email partial-unique.

## Security

- **`/metrics` без аутентификации** — порт на `127.0.0.1`, не проксируется nginx; сетевой allowlist/deny — на host-nginx.
- **CSRF-поверхность cookie-аутентификации с `SameSite=lax`** — double-submit CSRF-token требует согласования контракта фронта.
- **MinIO dev bucket + дефолтные `minioadmin`** — осознанный dev-риск; в prod перекрыт guard-ом. Оставить как есть.
- **`telegram_register`/bot-эндпоинты доверяют телу запроса** — граница только shared secret; сеть-уровневая изоляция `/telegram/bot/*` + ротация секрета (инфра-задача).

## Frontend

- **Type assertions в admin-хуках** — `(res.data as SuccessResponse<…>).data`: переход на generic-сервисы — широкий рисковый рефактор (WS-narrowing уже сделан).
- **tsconfig strict-флаги** — `exactOptionalPropertyTypes`/`noUncheckedIndexedAccess`/`noImplicitOverride`/`noPropertyAccessFromIndexSignature`: включение даёт лавину ошибок.
- **Дублирование `RestaurantPage` frontend/miniapp** — вынос общей презентации в `src/shared`.
- **`.then()` вместо `async/await` — ~24 файла** — широкий sweep по хукам; локально почищено там, где трогали.
- **Короткие имена переменных** — ~85 вхождений; переименование точечно там, где трогали.
- **Default-экспорты вместо именованных** — массовая замена по страницам/компонентам.

## Design

- **Покрытие a11y-разметкой ~26%** — проход по интерактивным спискам/табам/кнопкам-иконкам админки/вендора.
- **Типографика мимо токен-шкалы** — ~292 инлайновых `fontSize` в 40 `.tsx`: широкий mass-edit с риском визуальных регрессий.
- **Дрейф docs / легаси-алиасы** — `docs/problems/*` off-limits; легаси-слой алиасов — намеренный deprecation.
- **OrderStatusBadge мимо статус-утила** — перевод на `getOrderStatusStyle` меняет цветовые роли (риск регрессии).

## Telegram

- **Слабая типизация в consumer/хендлерах** — `Callable`-alias, pydantic/TypedDict-модели событий, generic-возврат вместо `Any`/`_UNSET`.
- **stdlib `logging` vs structlog** — унификация требует новой зависимости structlog в боте (uv.lock); заменено structured stdlib-форматом.
- **Нет обработки закрытия/сворачивания + safe-area** (`telegram-miniapp/App.tsx`, `sdk.ts`) — `showConfirm` при непустой корзине, `contentSafeAreaInset`/`safeAreaInset` в CSS-переменные.
- **Порядок инициализации SDK** — `ready()`/`expand()` синхронно при старте (убрать flash первого кадра).

## DevOps / Infra

- **Алерты никуда не доставляются** — требует Alertmanager + маршрут (Telegram/email): новый сервис в monitoring-стеке.
- **`tools/backup.sh` / `tools/restore.sh` нерабочи по умолчанию** — имя контейнера, `-d postgres`, `WITH (FORCE)`, расписание, шифрование, offsite; проверка restore на staging.
- **Псевдо-multi-stage backend-образа** — build-стадия ставит зависимости, runtime копирует только site-packages.
- **CI не собирает и не сканирует образы** — buildx-job + Trivy scan + push в GHCR, деплой по тегу образа.
- **SHA-пиновка actions** — требует верифицированных upstream-SHA (permissions/concurrency уже добавлены).
- **autoheal с docker.sock** — опциональное усиление через docker-socket-proxy.
- **TLS не терминируется в стеке** — закоммитить пример TLS+HSTS или задокументировать обязательный upstream.
- **`debug=True` снимает прод-guard разом** — добавлен warning-лог; вынести docs/security в независимый от `debug` флаг.

## Testing

- **omit целых фич из покрытия** — поэтапный вывод `admin`/`telegram`/`notifications`/`staff` из omit с добавлением тестов.
- **Интеграционные API-тесты мокают собственный сервис** — расширение `tests/db/` сквозными сценариями ошибок (базовый idempotency-e2e добавлен).
- **`fireEvent`→`userEvent`** — ~21 тест-файл (паттерн задан на `LoginPage`); крупный механический sweep.

## Прочее / отступления

- **CSS-файлы >300 строк** — `auth.css`, `ProductSheet.module.css`.
- **Именование каталогов / группировка `src/shared/components` / утечка `AxiosResponse` в UI** — широкие структурные правки frontend.
- **`initial_schema` migration 391 строка** — осознанное отступление, действий не требует.
- **OpenAPI-схема рассинхронизирована** — регенерировать (`make openapi`) `openapi/foodize.openapi.json` и `src/shared/types/api.ts` после финализации маршрутов.

---

## Хвосты для ручной проверки перед мержем

- `make seed` против dev-БД (идемпотентность после разбиения `tools/seed/`).
- Применить миграции к Postgres (`alembic upgrade head`, head `f1a2b3c4d5e6`) — локально гонялись на sqlite, `DB__URL` не был задан.
- WS-endpoint тесты (`test_ws_endpoints_*`, `test_orders_ws.py`, TestClient) виснут под Windows — гонять в CI/Linux.
