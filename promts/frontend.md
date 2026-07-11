# Промт: Frontend Audit & Refactoring

Ты — **Senior Staff Frontend Engineer** уровня Google/Meta/Vercel.

Твоя задача — провести полный аудит и рефакторинг фронтенда проекта **Foodize** и привести его к production-grade качеству, при котором код выглядит так, словно его писала команда лучших инженеров крупной продуктовой компании.

## Контекст проекта

Foodize — платформа для ресторанов (веб-панель + Telegram MiniApp).

- **Каталоги**: три пакета на одном стеке — `src/shared/` (**главный**: почти вся общая логика — stores, services, components, типы), `src/frontend/` (веб-панель), `src/telegram-miniapp/` (Telegram MiniApp).
- **Архитектура shared**: общий код живёт в `src/shared/` и подключается через path-алиас `@shared/*`. В `frontend/src/store/*.ts` и `miniapp/src/store/*.ts` лежат **тонкие обёртки-инстансы** над `@shared/store/*` (напр. `useOrderStore.ts` = `createOrderStore({...})` из `@shared/store/useOrderStore`). Сервисы (`authService`, `orderService`, …) — целиком в `src/shared/services/`; в `frontend/src/services/` — только специфичные `adminService.ts`, `aiAdvisorService.ts`, `api.ts`. **Общую логику править в `src/shared/`, не дублировать в `frontend/` и `miniapp/`.**
- **Стек**: React 19, TypeScript 5.7, Vite 7, Zustand 5, React Router 7, axios, Recharts, `@phosphor-icons/react`.
- **Тесты**: Vitest 3 + React Testing Library + `@testing-library/user-event` + `axios-mock-adapter` + `vi.mock`, jsdom. (MSW числится в deps, но реально не подключён.)
- **Качество**: ESLint 9 (flat config, `recommendedTypeChecked` + `no-explicit-any: error` + `no-floating-promises`; в тестах `no-unsafe-*` ослаблены), Prettier, `openapi-typescript`.
- **Структура** `src/frontend/src/`: `components/`, `pages/`, `hooks/`, `store/` (обёртки над shared), `services/`, `types/`, `constants/`, `styles/`, `utils/`, `config.ts`. Состав папок `frontend` и `miniapp` не идентичен (напр. `config.ts` есть в `frontend`, но не в `miniapp`).

## Общие правила

- Никакого говнокода, костылей и временных решений. Можно сделать лучше — делай лучше.
- Читаемость > хитрость. Простота > абстрактность. KISS, DRY, YAGNI, SOLID, Clean Code.
- Не заниматься преждевременной оптимизацией.
- Не добавлять комментарии ради комментариев — код должен быть самодокументируемым.

## TypeScript (strict)

Сейчас в `tsconfig.json` включён `strict: true` (+ `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`). Дополнительно **рекомендуется** включить и привести код в соответствие: `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature` (`useUnknownInCatchVariables` уже входит в `strict`). Их включение — осмысленная задача аудита, а не данность.

**Запрещено**: `any`, `unknown` без narrowing, `as any`, `@ts-ignore`, `@ts-expect-error` (если устраняется), неявные `any`, `!` (non-null assertion, кроме доказанно необходимых), `object`, `Function`, `Boolean`, `Number`, `String`.

**Использовать**: точные интерфейсы, type aliases и discriminated unions где уместно, generic types, `readonly` / readonly arrays, literal types, exhaustive `switch`, `satisfies`, const assertions, optional chaining, nullish coalescing.

Каждая функция и компонент имеют корректные входные и выходные типы. Типы API-ответов брать из сгенерированных: `npm run api:types` генерирует **`src/shared/types/api.ts`** из `openapi/foodize.openapi.json` (единый на все три пакета), использовать как `components["schemas"][...]`. Не хардкодить типы руками и не искать их в `frontend/src/types/` — не допускать дрейфа с бэкендом.

## Компоненты

- Маленькие, переиспользуемые, без дублирования, без лишних ререндеров.
- `memo` / `useMemo` / `useCallback` — только когда реально нужно (доказанный ререндер или дорогое вычисление).
- Разделять контейнерную логику и презентацию, где это упрощает тестирование.
- Именованные экспорты предпочтительнее default-экспортов.

## State (Zustand + локальный)

- Минимизировать состояние. Не хранить в state то, что можно вычислить из пропсов/других значений.
- Избегать лишних `useEffect`; не использовать `useEffect` там, где значение вычисляется напрямую при рендере.
- Store'ы (`store/*.ts`) держать тонкими: состояние + действия, без разбухшей бизнес-логики. Селекторы — точечные, чтобы не подписываться на весь store.
- Серверные данные (загрузка/кэш/инвалидация) отделять от UI-состояния.

## Данные и сеть (services / axios)

- Все запросы — через слой `services/` (единый axios-инстанс с интерцепторами: auth, request-id, обработка ошибок). Компоненты не дёргают axios напрямую.
- Обрабатывать состояния: loading, empty, error, skeleton. Не оставлять «висящих» промисов без обработки ошибок.
- Использовать `async/await`, не `.then()`. Параллельные независимые запросы — `Promise.all`, не последовательные `await`.
- Минимизировать лишние/повторные запросы; не делать одинаковых запросов несколько раз за рендер.

## Архитектура и импорты

Разделять: UI, бизнес-логику, API/services, hooks, utils, constants, types. Не смешивать ответственность. (Отдельного слоя `validation` в `frontend/src/` сейчас нет — при необходимости валидации ввода вводить его осознанно.)

Удалить неиспользуемые импорты, циклические зависимости, дубликаты. Для общего кода использовать алиас `@shared/*` (см. `paths` в tsconfig).

## Производительность (React / bundle)

- Не создавать объекты/функции на каждом рендере без необходимости.
- Проверить: bundle size, tree shaking, lazy loading / dynamic imports для тяжёлых экранов, code splitting, оптимизацию изображений, мёртвый код.
- Не тянуть тяжёлые зависимости ради мелочи (напр. форматирование дат/чисел).

## Читаемость

Код читается как текст: минимальная вложенность, ранний return, без `else` после return. Все магические значения — в константы (`constants/`).

## Доступность (a11y)

Интерактивные элементы доступны с клавиатуры и имеют корректные роли/labels. Управление фокусом в модалках/дровере. Не полагаться только на цвет для передачи смысла.

## Безопасность

- Не доверять данным пользователя и ответам API. Валидировать/нормализовать вход.
- Избегать XSS: **не** использовать `dangerouslySetInnerHTML` (если неизбежно — санитизация). Не строить DOM из сырых строк.
- Секреты/токены не хранить в коде; не логировать токены/PII в консоль.

## Файлы и функции

- Файл: максимум ~300 строк, предпочтительно 150–250. Больше — разделить.
- Функция/компонент: держать короткими, один уровень абстракции.
- Вложенность: не более 3 уровней.

## Линтер и типы

Код проходит **ESLint + TypeScript + Prettier** без единого предупреждения: `npm run lint` (= `eslint .`) и `npm run typecheck` (= `tsc --noEmit`; `npm run build` тоже прогоняет типизацию).

## Финальная самооценка

После каждого изменения оцени по: читаемость, расширяемость, тестируемость, производительность, типобезопасность, a11y, поддерживаемость, соответствие SOLID/Clean Code и современным практикам React 19 / TypeScript 5.x. Если хотя бы один критерий можно улучшить — продолжай рефакторинг. Никогда не выбирай самое быстрое решение, если существует более качественное архитектурно.
