# План: идеальное мобильное приложение Foodize (iOS + Android)

> Цель: production-grade нативное приложение под обе платформы — безопасное, быстрое,
> работающее со всей системой Foodize, с максимальным переиспользованием `@foodize/shared`.
> База (Expo SDK 53 + expo-router + shared через `.instance`) уже существует в `src/mobile`.

---

## 0. Резюме стратегии (решения приняты)

| Решение | Выбор |
|---|---|
| UI-слой | **Нативный UI с нуля** на RN-примитивах, поверх shared-логики |
| Центр правды | `@foodize/shared` (store/services/hooks/i18n/utils/types) — единственный |
| Headless-рефактор web-компонентов | **По требованию, поэкранно** (не блокирует web) |
| Глубина плана | **Максимальная** — все нативные интеграции |
| Нативная фича приоритета 1 | **Push-уведомления** (APNs/FCM) |
| Дистрибуция | **App Store + Google Play** (EAS Build/Submit, TestFlight/internal, OTA) |
| Платежи / карты / гео | Пока **не в scope** — заложены как будущий этап (раздел 14) |

---

## 1. Принцип «Один центр правды»

Мультиплатформенный React не делит **пиксели** — он делит **поведение**. Разделяем shared
на два слоя и работаем строго по нему:

### Слой A — платформо-агностичный (переиспользуется в мобилке 1:1, УЖЕ работает)
- `shared/store/*` — Zustand: auth, cart, orders, favorites, notifications, restaurant, theme, language, modal
- `shared/services/*` — весь API/WS/SSE (26 сервисов), `.instance`-инъекция клиента
- `shared/hooks/*` — логика экранов: `useHomePageLogic`, `useOrdersPageLogic`,
  `useRestaurantPageController`, `useProfilePage`, `useFavoritesPage`, `useOrderWebSocket`,
  `useInfiniteList`, `useEtaText`
- `shared/i18n/*`, `shared/types/*`, `shared/utils/*`, `shared/constants/*`

**Правило:** мобилка НЕ дублирует ничего из слоя A. Любая новая бизнес-логика, полезная и
web, и мобилке — пишется в shared, а не в `mobile/src`.

### Слой B — презентационный (`shared/components`, `shared/pages`) — web-DOM, в RN НЕ идёт
`<div>`, `className`/CSS, `@phosphor-icons/react`, `IntersectionObserver`, `MouseEvent`.
Мобилка строит собственные RN-экраны, но **логику берёт из shared-хуков (слой A)**.

### Правило headless-выноса (поэкранно, по требованию)
Когда экрану мобилки нужна логика, «вплавленная» в web-JSX (пример: `RestaurantCard` держит
`IntersectionObserver`+видимость внутри себя):
1. Выносим чистую логику в новый shared-хук (`shared/hooks/useRestaurantCard.ts`).
2. Web-компонент рефакторим на использование этого хука (рендер не меняется → web не ломается).
3. Мобильный компонент использует тот же хук.

Это доводит «один центр правды» до конца **без большого предварительного рефактора** и без
риска для работающего web. Делаем только для тех экранов, которые реально строим.

---

## 2. Технологический стек

Базис уже зафиксирован в `package.json` / `app.json`. Достраиваем:

### Уже есть
Expo SDK 53, expo-router v5, React 19.2.7, RN 0.79.5 (New Arch **включена**), TypeScript strict,
Zustand 5, Axios, `expo-secure-store`, `@react-native-async-storage/async-storage`,
gesture-handler, reanimated, safe-area-context, screens, Jest + `@testing-library/react-native`.

### Добавить
| Область | Пакет | Зачем |
|---|---|---|
| Списки | `@shopify/flash-list` | Производительные виртуализированные списки (каталог, заказы) |
| Изображения | `expo-image` | Кэш, blurhash-плейсхолдеры, приоритеты |
| Push | `expo-notifications` + `expo-device` | APNs/FCM токен, каналы, локальные/пуш |
| Иконки | `@expo/vector-icons` (Phosphor/Ionicons) | Замена `@phosphor-icons/react` (DOM) |
| Deep links | `expo-linking` (есть) + конфиг | Универсальные ссылки на заказ/ресторан |
| Хаптика | `expo-haptics` | Нативный тактильный отклик |
| Sentry | `@sentry/react-native` | Крэш-репортинг + performance |
| Аналитика | тонкий враппер (см. §11) | События без вендор-локина |
| Обновления | `expo-updates` | OTA-патчи JS без релиза в стор |
| Шрифты | `expo-font` | Manrope из `shared/fonts` |
| Сеть | `@react-native-community/netinfo` | Оффлайн-детект, баннер, очередь |
| Storage/persist | `react-native-mmkv` (опц.) | Быстрый persist для Zustand вместо AsyncStorage |
| Splash | `expo-splash-screen` | Контролируемое скрытие сплэша |
| Тесты E2E | Maestro | UI-флоу-тесты на реальных сборках |

**New Architecture остаётся включённой** (`newArchEnabled: true`) — Fabric + TurboModules,
меньше мостовых задержек, лучше анимации.

---

## 3. Архитектура каталогов мобилки

```
src/mobile/
├── app/                          # expo-router (только маршрутизация, тонкие обёртки)
│   ├── _layout.tsx               # root: провайдеры, bootstrap токена, splash, шрифты
│   ├── (auth)/                   # группа без табов
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                   # табы для авторизованного клиента
│   │   ├── _layout.tsx           # Bottom tabs: Home / Orders / Favorites / Profile
│   │   ├── index.tsx             # Home (каталог)
│   │   ├── orders.tsx
│   │   ├── favorites.tsx
│   │   └── profile.tsx
│   ├── restaurant/[id].tsx       # экран ресторана + меню
│   ├── order/[id].tsx            # статус заказа (WS live)
│   ├── notifications.tsx
│   ├── settings.tsx
│   ├── legal/[doc].tsx
│   └── +not-found.tsx
├── src/
│   ├── screens/                  # реализация экранов (толстые компоненты)
│   ├── components/               # RN UI-примитивы и доменные карточки
│   │   ├── ui/                   # AppText, Screen, Button, Input, Sheet, Badge, Skeleton...
│   │   └── domain/               # RestaurantCard, MenuItemCard, OrderCard, CartSheet...
│   ├── store/                    # платформенные .instance-реализации (auth/cart/orders)
│   ├── services/                 # api.ts, tokenRefresh.ts, push.ts, analytics.ts, links.ts
│   ├── platform/                 # tokenStorage, secureStore, notifications native glue
│   ├── theme/                    # токены + useTheme (мост к shared/styles токенам)
│   ├── i18n/                     # re-export shared + AsyncStorage-persist языка
│   ├── navigation/               # типы маршрутов, хелперы, guard-логика
│   └── config/                   # env.ts
└── (конфиги: app.json, eas.json, metro/babel/tsconfig, sentry)
```

**Дисциплина:** `app/*` — только навигация; вся логика экрана живёт в `src/screens/*`, а
доменная логика — в `shared/hooks`.

---

## 4. Навигация (expo-router)

- **Файловая маршрутизация**, типизированные маршруты (`experiments.typedRoutes: true` — уже есть).
- **Группы**: `(auth)` — стек логина/регистрации; `(tabs)` — авторизованная зона.
- **Bottom tabs**: Home, Orders, Favorites, Profile — доменный аналог `shared/components/BottomNav`,
  но нативный (`expo-router` Tabs / `@react-navigation/bottom-tabs`).
- **Guard-логика**: в `app/_layout.tsx` при старте — `tokenStorage.loadAccessToken()` +
  `fetchMe()`; редирект неавторизованных в `(auth)`. Ролевые экраны (vendor/admin/staff)
  на первом этапе **вне scope мобилки** — это менеджерские дашборды, оставляем web.
- **Deep linking**: `scheme: foodize` уже задан. Настроить:
  - `foodize://order/{id}`, `foodize://restaurant/{id}`
  - Universal Links (iOS `associatedDomains`) + App Links (Android `intentFilters`) на домен
    Foodize — открытие заказа из push/письма прямо в нужный экран.
- **Состояние навигации** переживает холодный старт для критичных экранов (статус заказа).

---

## 5. Аутентификация и сессии (безопасность — критично)

Мобилка использует **Bearer + refresh**, НЕ cookie (в отличие от web). База уже есть
(`mobile/src/services/api.ts`, `tokenRefresh.ts`, `platform/tokenStorage.ts`).

### Достроить
- **Хранение токенов**: access — в памяти + `expo-secure-store` (Keychain iOS / Keystore
  Android). Refresh — **только** `expo-secure-store`, никогда в AsyncStorage/JS-логах.
- **Экраны логина/регистрации** (сейчас плейсхолдеры): построить на `shared/services/authService`
  + `shared/store` (createAuthStore). Валидация телефона — `shared/utils/phone`.
- **Авто-refresh**: уже подключён через `createApi({ refreshToken })`. Проверить гонки
  (одновременные 401 → один refresh, очередь ожидающих — логика в `shared/services/createApi`).
- **onUnauthorized** → чистка secure-store + редирект в `(auth)` (`setOnUnauthorized` уже есть).
- **Биометрический ре-логин** (опц., §14): `expo-local-authentication` — Face ID/отпечаток
  разблокирует хранимый refresh.
- **Certificate pinning** (безопасность): для production-сборок — pinning API-домена
  (`expo-build-properties` / нативный слой) против MITM.
- **Jailbreak/root-детект** (опц.) — предупреждение при компрометированном устройстве.

---

## 6. Экраны (поэтапно) — логика из shared, рендер нативный

| Экран | Shared-хук/сервис | Нативные особенности |
|---|---|---|
| **Auth (login/register)** | `authService`, `createAuthStore` | Secure-store, автозаполнение SMS-кода, биометрия |
| **Home / каталог** | `useHomePageLogic`, `useInfiniteList` | FlashList, `expo-image`, pull-to-refresh, skeleton |
| **Restaurant + меню** | `useRestaurantPageController`, `useRestaurantReviews` | Параллакс-хедер (reanimated), sticky-категории |
| **Product sheet** | логика из `ProductSheet` → вынести в `useProductSheet` | Нативный bottom-sheet (gesture-handler) |
| **Cart** | `createCartStore`, `useCartStore` | Persist-корзина (MMKV), optimistic из `store/optimistic` |
| **Checkout / оформление** | `orderService` | Нативные шаги, хаптика на успех |
| **Orders (список)** | `useOrdersPageLogic` | FlashList, статус-бейджи, live-обновление |
| **Order status (live)** | `useOrderWebSocket`, `useEtaText` | WS через `createOrderWebSocket`, live-ETA, push-дубль |
| **Favorites** | `useFavoritesPage`, `useFavoriteStore` | Swipe-to-remove |
| **Profile** | `useProfilePage` | Аватар, выход, ссылки |
| **Settings** | `useThemeStore`, `useLanguageStore` | Тема (light/dark/system), язык с persist |
| **Notifications** | `notificationService`, `createNotificationStore` | Список + связка с нативными push |
| **Legal** | `shared/pages` логика | Статические md-документы нативно |

Приоритет реализации: Auth → Home → Restaurant → Cart/Checkout → Orders/Status → Favorites/
Profile/Settings → Notifications.

---

## 7. Реальное время (WebSocket) и синхронизация

- `shared/services/reliableWebSocket` + `wsFactories` уже подключены в `mobile/services/api.ts`
  (`createOrderWebSocket`, `createNotificationWebSocket`).
- **Жизненный цикл под мобилку**: WS должен корректно вести себя при уходе в фон/возврате
  (`AppState`): пауза при background, реконнект + доб-фетч при foreground (сервер уже
  реконнект-устойчив — `reliableWebSocket`).
- **Статус заказа**: live через WS **плюс** нативный push (§8) как fallback, если приложение
  убито/в фоне.
- **NetInfo**: при потере сети — баннер оффлайна, при возврате — форс-реконнект + инвалидация.

---

## 8. Push-уведомления (ПРИОРИТЕТ 1)

Backend `notifications` (broker/consumer/api) уже есть — нужен нативный транспорт.

### iOS (APNs) + Android (FCM)
1. `expo-notifications` + `expo-device`; получить Expo Push Token / нативные токены.
2. **Регистрация токена**: после логина — отправлять push-токен на backend (нужен эндпоинт
   `POST /notifications/devices` — **проверить/добавить на бэке**; см. §15). Отвязка при logout.
3. **Каналы Android** (`order_status`, `promo`, `system`) с приоритетами и звуком.
4. **iOS**: запрос permission в правильный момент (после первого заказа, не на старте),
   `associatedDomains` для universal links из пуша.
5. **Обработка**:
   - foreground → баннер + обновление стора заказа;
   - tap → deep link на `order/{id}` (§4);
   - background/killed → системный пуш от бэка (payload с `orderId`, `status`).
6. **Синхронизация с WS**: дедупликация (одно событие из WS и из push — не дублить UI).
7. **Локальные уведомления**: напоминания (заказ готов к выдаче) при отсутствии сети.
8. **Badge count** непрочитанных (`notificationService`).

---

## 9. Тема, i18n, дизайн-система

### Тема
- Токены темы — мост к `shared/styles` (цвета `--fire` и пр. → RN-объекты тем).
- `useThemeStore` (shared) управляет light/dark/system; `mobile/src/theme/useTheme` отдаёт
  токены в RN-формате. Реакция на системную тему (`Appearance`).

### i18n
- Re-export `shared/i18n` (уже в `mobile/src/i18n`).
- **Починить persist языка** (известный TODO): `useLanguageStore` персистит через web
  `localStorage`, которого нет в RN. Сделать **AsyncStorage-адаптер** для Zustand `persist`
  (по образцу `useAuthStore`). Это касается shared → добавить абстракцию storage-backend в
  `shared/store/useLanguageStore` c инъекцией платформенного адаптера (аналог `.instance`).
- Определение языка: системная локаль устройства (`expo-localization`) → fallback ru.

### Дизайн-система (нативная)
- Собрать `src/components/ui`: `AppText` (есть), `Screen` (есть), `Button`, `Input`, `Sheet`,
  `Badge`, `Skeleton`, `Divider`, `Avatar`, `Chip`, `Rating`.
- Шрифты Manrope через `expo-font` из `shared/fonts`.
- Единые spacing/radius/elevation токены. Тёмная тема — с первого экрана.
- Иконки — `@expo/vector-icons` (Phosphor-набор для визуального паритета с web).

---

## 10. Производительность (цель — «быстрое»)

- **Списки**: `@shopify/flash-list` везде, где длинные списки (каталог, заказы, отзывы).
- **Изображения**: `expo-image` с кэшем + blurhash; правильные размеры с бэка (media).
- **Reanimated 3** для анимаций/жестов на UI-потоке (без JS-моста).
- **Hermes** (в Expo по умолчанию) — движок JS.
- **New Architecture** (Fabric/TurboModules) включена.
- **Мемоизация**: shared-хуки уже отдают стабильные ссылки; на экранах — `memo`/`useCallback`.
- **Persist через MMKV** (опц.) — быстрее AsyncStorage для корзины/сессии.
- **Bundle**: контроль размера, ленивые тяжёлые экраны, `expo-updates` для OTA-патчей.
- **Метрики**: TTI холодного старта, FPS списков, размер бандла — в CI-бюджеты.

---

## 11. Наблюдаемость: крэши, ошибки, аналитика

- **Sentry** (`@sentry/react-native`): крэши + performance трейсинг + source maps через EAS.
  Реюз `shared/utils/logError` как единой точки логирования → прокидка в Sentry.
- **ErrorBoundary**: RN-версия (`shared/components/ErrorBoundary` — web; сделать натив-обёртку
  или вынести логику в хук).
- **Аналитика**: тонкий `services/analytics.ts` (вендор-агностичный интерфейс `track(event, props)`)
  — ключевые воронки: view_restaurant, add_to_cart, place_order, order_delivered.
- **API-ошибки**: `shared/utils/translateApiError` → нативные тосты/диалоги.

---

## 12. Безопасность (сводно — «безопасное»)

- Токены только в Keychain/Keystore (`expo-secure-store`); refresh не в JS-storage.
- **Certificate pinning** для prod.
- **Никаких секретов в бандле**: только `EXPO_PUBLIC_*` (публичные), приватное — на бэке.
- **Deep-link валидация**: не доверять параметрам ссылки, ре-фетч данных заказа по id.
- **Экранирование при бэкграунде** (iOS privacy screen) для экранов с чувствительными данными.
- **Обфускация/минификация** production JS; отключить remote debugging в prod.
- **Разрешения по минимуму**: запрашивать push/гео/камеру только при необходимости, с объяснением.
- **RASP-опции** (§5): jailbreak/root-детект, biometric-gate.
- **Соответствие сторам**: App Privacy (iOS Nutrition Label), Data Safety (Google Play) —
  описать сбор данных (push-токен, аналитика).
- Security-review диффа перед каждым релизом (есть `/security-review`).

---

## 13. Тестирование и качество

- **Unit**: Jest + `@testing-library/react-native` — компоненты и store-инъекции мобилки.
  Логика уже покрыта в shared (Vitest).
- **Покрытие тестами — минимум 90%** (statements/branches/functions/lines). Порог жёстко
  проставляется в `jest.config.js` через `coverageThreshold.global` (`branches/functions/lines/
  statements: 90`) — CI **падает**, если покрытие ниже. Тот же порог 90% держим и в `shared`
  (`vitest.config.ts` `coverage.thresholds`).
- **E2E**: Maestro-флоу на реальных сборках — login → каталог → заказ → статус.
- **Типы**: `tsc --noEmit` (strict), ESLint (`eslint-config-expo` + строгие TS-правила).
- **CI**: добавить mobile в `.github/workflows/ci.yml` — lint + typecheck + `jest --coverage`
  (с провалом ниже 90%); EAS-сборки на тегах. `make lint`/`make test` уже включают mobile.
- **Ручное**: тест-матрица устройств (старый Android, iPhone SE, планшеты — хотя tablet
  выключен в `app.json`, проверить), тёмная тема, оффлайн, слабая сеть, RTL (на будущее).
- **Бюджеты производительности** в CI (§10).

---

## 14. Будущие нативные фичи (за пределами первого релиза)

Заложены архитектурно, реализуются позже:
- **Платежи** в приложении (карта/СБП/Apple Pay/Google Pay) — плат. SDK + финансовое ревью сторов.
- **Карты и геолокация** (`react-native-maps`, `expo-location`) — карта ресторанов, адрес доставки.
- **AI-ассистент заказа** — `shared/services/aiOrderService` (стриминг уже есть) → голос/чат-заказ.
- **Биометрия** (`expo-local-authentication`) — быстрый вход.
- **Оффлайн-режим** — очередь действий, фоновая синхронизация.
- **Виджеты / Live Activities** (iOS) — статус заказа на локскрине.
- **RuStore** — отдельный пайплайн дистрибуции для РФ.

---

## 15. Требуемые изменения на backend (проверить/добавить)

- **ПОДТВЕРЖДЁННЫЙ ПРОБЕЛ (проверено в `features/notifications/api.py`):** эндпоинта
  регистрации push-устройств НЕТ. Существующие эндпоинты — только список/чтение
  in-app уведомлений (GET ``, POST `/{id}/read`, POST `/read-all`), а broker/consumer
  рассылают через WebSocket, не через APNs/FCM. Нужно добавить отдельным бэкенд-этапом:
  1. Модель `PushDevice` (user_id, platform, token, language, created_at) + Alembic-миграция.
  2. CRUD + `POST /notifications/devices` (upsert по token) и `DELETE /notifications/devices/{token}`.
  3. Диспетчер нативных пушей (APNs через `aioapns`/`httpx`, FCM через HTTP v1) в
     `notifications/consumer` — на событие смены статуса заказа слать пуш на все устройства
     пользователя. Клиент мобилки (`src/services/push.ts`) уже готов к грациозной деградации,
     если эндпоинт отсутствует.
- Проверить, что refresh-flow отдаёт корректные коды для мобильного Bearer (не cookie).
- Media: варианты размеров изображений под мобильные плотности (`@2x/@3x`).
- CORS/allowed origins — для мобилки не критично (нативный клиент), но проверить.

---

## 16. CI/CD и релизы (App Store + Google Play)

### EAS
- `eas.json`: профили `development` (dev-client), `preview` (internal/TestFlight), `production`.
- **EAS Build**: облачная сборка iOS (нужен Apple Developer аккаунт, сертификаты — EAS-managed)
  и Android (keystore — EAS-managed).
- **EAS Submit**: авто-загрузка в App Store Connect и Google Play Console.
- **EAS Update (OTA)**: `expo-updates` — патчи JS без ревью стора (в рамках правил).
- **Секреты**: EAS Secrets для API-URL и ключей (Sentry DSN и т.п.).

### Пайплайн релиза
1. Bump версии/`buildNumber`/`versionCode`.
2. CI: lint + typecheck + jest + Maestro на preview-сборке.
3. EAS Build (prod) обе платформы.
4. TestFlight (iOS) + Internal testing (Android) → QA.
5. Раскатка в сторы через EAS Submit; поэтапный rollout на Android.
6. Мониторинг Sentry первые 48ч; OTA-хотфиксы при необходимости.

### Store-требования (чек-лист)
- iOS: App Privacy details, associatedDomains, permission usage strings (push, позже гео/камера),
  скриншоты, App Review guidelines (особенно если добавятся платежи).
- Android: Data Safety form, target SDK актуальный, adaptive icon (есть), App Links verification.
- Обе: политика конфиденциальности (есть `Legal`), возрастной рейтинг, метаданные, локализация
  ru/en.

---

## 17. Дорожная карта (этапы)

**Этап 0 — фундамент ✅ ГОТОВО**
Expo/router/shared-инъекция, провайдеры в `_layout`, сплэш/тема (light/dark), дизайн-система
`src/components/ui`, persist языка (RN-shim через AsyncStorage/expo-localization), Sentry +
ErrorBoundary.

**Этап 1 — Auth + каркас ✅ ГОТОВО**
Экраны login/register, secure-store (Bearer+refresh), guard-навигация, табы, deep-links
`foodize://` + universal/app links в `app.json`.

**Этап 2 — Каталог + ресторан ✅ ГОТОВО**
Home (FlashList/expo-image, пагинация через `onEndReached`), restaurant+меню, ProductSheet,
поиск/фильтры/категории на shared-хуках.

**Этап 3 — Корзина + оформление ✅ ГОТОВО**
Cart (persist), checkout, optimistic из shared, создание заказа.

**Этап 4 — Заказы + live-статус + Push ✅ ГОТОВО (клиент); бэкенд push реализован**
Orders, order status (WS + ETA + хаптика), push-клиент (expo-notifications, каналы,
deep-links, дедуп). Бэкенд: модель `PushDevice`, миграция, `POST/DELETE /notifications/devices`,
APNs/FCM-диспетчер в consumer. Для боевого включения нужны APNs `.p8` / FCM ключи + `h2` extra
(см. §15).

**Этап 5 — Профиль, избранное, настройки, уведомления, legal ✅ ГОТОВО**
Полный клиентский функционал; тёмная тема и i18n (ru/en с persist) завершены.

**Этап 6 — Закалка и релиз (частично)**
✅ Безопасность: биометрия, privacy-screen, integrity-детект, прикладной pinning
(истинный TLS-pinning требует dev-build, см. §12). ✅ E2E: Maestro-флоу (auth, order).
✅ Оффлайн: NetInfo-баннер + персистентная очередь действий. ✅ EAS/CI (coverage-gate 90%).
Осталось: реальные ассеты (сейчас брендовые плейсхолдеры), заполнить плейсхолдеры
`eas.json`/`app.json`, prod-сборки, TestFlight/Internal, публикация в сторы.

**Этап 7+ — расширения (§14)**
Платежи, карты/гео, AI-заказ, виджеты/Live Activities, RuStore.

---

## 18. Инварианты (нарушать нельзя)

1. Бизнес-логика — только в `@foodize/shared` (слой A). Мобилка её потребляет, не дублирует.
2. Общий с web код при доработке под мобилку → выносится в shared, web не ломается.
3. Никаких комментариев в коде; импорты — только вверху файла.
4. Токены — только в secure-store; секреты — не в бандле.
5. Каждый экран: тонкий `app/*` (роут) → `src/screens/*` (view) → `shared/hooks` (логика).
6. Покрытие тестами — не ниже 90% (порог в CI, сборка падает при недоборе).
7. Перед релизом: lint + typecheck + tests (≥90% coverage) + security-review.
