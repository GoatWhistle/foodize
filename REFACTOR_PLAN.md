# Foodize — план рефакторинга: единое ядро для Frontend и Telegram Mini-App

> Цель: `src/shared` становится центром правды. Обе аппки — почти идентичны для пользователя,
> различия только там, где это продиктовано экраном или платформой.

---

## Что видим сейчас (визуальный аудит)

### Frontend (порт 5173, десктоп 1280×900)
- Топ-хедер: логотип + поиск + кнопка фильтров + переключатель темы + кнопка входа
- Пустая главная (пользователь не авторизован — рестораны не загружаются)
- Нет bottom nav, FAB корзины не виден без товаров
- Страница логина недоступна по `/auth/login` — роутинг редиректит на 404

### Telegram Mini-App (порт 5174, мобильный 390×844)
- Нет хедера — поиск сразу сверху страницы
- 4 ресторана в 2-колоночном гриде с карточками
- Сортировочные чипсы: По умолчанию / Оценка / Популярное / Открытые
- Bottom nav: Рестораны | Заказы | Профиль
- Страница ресторана: hero с emoji-placeholder, рейтинг-пилюля, категории меню, карточки товаров с кнопкой `+`
- Заказы: пустой стейт с 3 фильтрами (Все / Активные / Выданные)
- Профиль: статистика (0 заказов · 0 избранных), меню пунктов, переключатель темы

**Вывод**: миниаппка визуально чище и мобильно-правильнее. Фронт отстаёт по UX-паттернам.

---

## Диагностика дублирования

| Что | Frontend | Miniapp | Shared | Статус |
|-----|----------|---------|--------|--------|
| `EmptyState` | `components/ui/EmptyState.jsx` | `components/ui/EmptyState.jsx` | `components/EmptyState/` | Тройной дубль |
| `RestaurantCard` | `components/ui/RestaurantCard.jsx` | `components/ui/RestaurantCard.jsx` | `components/RestaurantCard/` | Тройной дубль |
| `MenuItemCard` | `components/ui/MenuItemCard.jsx` | `components/ui/MenuItemCard.jsx` | `components/MenuItemCard/` | Тройной дубль |
| `OrderButton` | `components/ui/OrderButton.jsx` | `components/ui/OrderButton.jsx` | `components/OrderButton/` | Тройной дубль |
| `Pagination` | `components/ui/Pagination.jsx` | `components/ui/Pagination.jsx` | `components/Pagination/` | Тройной дубль |
| `ErrorBoundary` | `components/ui/ErrorBoundary.jsx` | `components/ui/ErrorBoundary.jsx` | `components/ErrorBoundary/` | Тройной дубль |
| `ProductSheet` | `components/ui/ProductSheet.jsx` | `components/ui/ProductSheet.jsx` | ❌ нет | Двойной дубль |
| `CartDrawer` | `components/ui/CartDrawer.jsx` | `components/CartDrawer.jsx` + `components/ui/CartDrawer.jsx` | ❌ нет | Двойной + 2 версии в miniapp |
| `OrderStatusBadge` | `components/ui/OrderStatusBadge.jsx` | `components/ui/OrderStatusBadge.jsx` | ❌ нет | Двойной дубль |
| `ConfirmDialog` | `components/ui/ConfirmDialog.jsx` | ❌ нет | ❌ нет | Только в frontend |
| `permissions.js` | `utils/permissions.js` | `utils/permissions.js` | `utils/permissions.js` | Тройной дубль |
| `translateApiError.js` | `utils/translateApiError.js` | `utils/translateApiError.js` | `utils/translateApiError.js` | Тройной дубль |
| `locales.js` | `utils/locales.js` | `utils/locales.js` | ❌ нет | Двойной дубль |
| `useDebounce.js` | ❌ (inline debounce) | ❌ (inline) | `utils/useDebounce.js` | Не используется из shared |
| Все сервисы | `services/*.js` | `services/*.js` | `services/index.js` (фабрики) | Дублирование |
| `useAuthStore` | `store/useAuthStore.js` | `store/useAuthStore.js` | ❌ нет | Двойной дубль |
| `useOrderStore` | `store/useOrderStore.js` | `store/useOrderStore.js` | ❌ нет | Двойной дубль с расхождениями |
| `useFavoriteStore` | `store/useFavoriteStore.js` | `store/useFavoriteStore.js` | `store/createFavoriteStore.js` | Тройной дубль |
| `useRestaurantStore` | `store/useRestaurantStore.js` | `store/useRestaurantStore.js` | ❌ нет | Двойной дубль |

---

## Архитектура после рефакторинга

```
src/
├── shared/                          # ЦЕНТР ПРАВДЫ
│   ├── components/
│   │   ├── RestaurantCard/          # единственная версия
│   │   ├── MenuItemCard/            # единственная версия  
│   │   ├── ProductSheet/            # НОВЫЙ — переносим из обоих
│   │   ├── CartDrawer/              # НОВЫЙ — унифицируем обе версии
│   │   ├── OrderStatusBadge/        # НОВЫЙ — переносим из обоих
│   │   ├── ConfirmDialog/           # НОВЫЙ — переносим из frontend
│   │   ├── EmptyState/              # уже есть, чистим дубли
│   │   ├── ErrorBoundary/           # уже есть, чистим дубли
│   │   ├── OrderButton/             # уже есть, чистим дубли
│   │   ├── Pagination/              # уже есть, чистим дубли
│   │   ├── LegalPage/               # уже есть
│   │   └── index.js                 # реэкспорт всего
│   ├── store/
│   │   ├── useAuthStore.js          # НОВЫЙ — объединяем обе версии
│   │   ├── useOrderStore.js         # НОВЫЙ — объединяем с параметризацией
│   │   ├── useFavoriteStore.js      # рефакторим из createFavoriteStore
│   │   ├── useRestaurantStore.js    # НОВЫЙ — переносим из обоих
│   │   ├── useNotificationStore.js  # НОВЫЙ — из miniapp (только WS)
│   │   └── index.js
│   ├── services/
│   │   ├── api.js                   # НОВЫЙ — базовый axios instance
│   │   ├── authService.js           # НОВЫЙ — переносим общую логику
│   │   ├── cartService.js
│   │   ├── favoriteService.js
│   │   ├── menuService.js
│   │   ├── orderService.js
│   │   ├── promoService.js
│   │   ├── restaurantService.js
│   │   ├── reviewService.js
│   │   ├── staffService.js
│   │   ├── userService.js
│   │   ├── vendorService.js
│   │   ├── notificationService.js   # НОВЫЙ — WS + REST
│   │   └── index.js
│   ├── pages/                       # НОВАЯ ПАПКА
│   │   ├── HomePage/                # НОВЫЙ — единая страница с адаптерами
│   │   ├── RestaurantPage/          # НОВЫЙ — единая страница
│   │   ├── OrdersPage/              # НОВЫЙ — единая страница
│   │   ├── OrderStatusPage/         # НОВЫЙ — единая страница
│   │   ├── ProfilePage/             # НОВЫЙ — базовая (клиентская) версия
│   │   ├── FavoritesPage/           # НОВЫЙ — единая страница
│   │   └── index.js
│   ├── hooks/
│   │   ├── useDebounce.js           # уже есть
│   │   ├── useInfiniteScroll.js     # НОВЫЙ — IntersectionObserver
│   │   ├── usePullToRefresh.js      # НОВЫЙ — из miniapp
│   │   ├── useOrderWebSocket.js     # НОВЫЙ — WS логика из OrderStatusPage
│   │   └── index.js
│   ├── utils/
│   │   ├── permissions.js           # уже есть, чистим дубли
│   │   ├── translateApiError.js     # уже есть, чистим дубли
│   │   ├── locales.js               # НОВЫЙ — CATEGORY_RU, ORDER_STATUS_RU
│   │   ├── restaurant.js            # НОВЫЙ — isRestaurantOpen, getGreeting
│   │   └── index.js
│   ├── tokens.css                   # уже есть
│   └── index.css                    # уже есть
│
├── frontend/src/
│   ├── App.jsx                      # только роутинг (vendor/admin/staff маршруты)
│   ├── components/
│   │   ├── layout/                  # MainLayout, header — только здесь
│   │   ├── dashboard/               # vendor/admin/staff UI — только здесь
│   │   └── ui/
│   │       ├── NotificationBell.jsx # только здесь
│   │       ├── FoodizeLogo.jsx      # только здесь
│   │       ├── ShareModal.jsx       # только здесь
│   │       ├── OrderAssistant.jsx   # только здесь
│   │       ├── QRCodeModal.jsx      # только здесь
│   │       ├── ThemeToggle.jsx      # только здесь
│   │       └── SplashScreen.jsx     # только здесь
│   ├── pages/
│   │   ├── home/HomePage.jsx        # extends @shared/pages/HomePage
│   │   ├── restaurant/              # extends @shared/pages/RestaurantPage
│   │   ├── orders/                  # extends @shared/pages/OrdersPage
│   │   ├── profile/ProfilePage.jsx  # extends @shared/pages/ProfilePage + роли
│   │   ├── admin/                   # только frontend
│   │   ├── vendor/                  # только frontend
│   │   ├── staff/                   # только frontend
│   │   ├── display-board/           # только frontend
│   │   └── auth/                    # extends shared LoginPage
│   ├── services/
│   │   ├── adminService.js          # только здесь
│   │   └── aiAdvisorService.js      # только здесь
│   └── store/
│       └── useModalStore.js         # только здесь (если нет в miniapp)
│
└── telegram-miniapp/src/
    ├── App.jsx                      # только роутинг + Telegram инициализация
    ├── components/
    │   ├── BottomNav.jsx            # только здесь
    │   └── ActiveOrderBanner.jsx    # только здесь
    ├── pages/
    │   ├── home/HomePage.jsx        # extends @shared/pages/HomePage
    │   ├── restaurant/              # extends @shared/pages/RestaurantPage
    │   ├── orders/                  # extends @shared/pages/OrdersPage
    │   ├── profile/ProfilePage.jsx  # extends @shared/pages/ProfilePage (урезанный)
    │   └── notifications/           # только здесь
    ├── telegram/
    │   ├── sdk.js                   # только здесь
    │   └── init.js                  # только здесь
    └── hooks/
        └── useTheme.js              # только здесь
```

---

## Фазы рефакторинга (приоритет сверху вниз)

---

### ФАЗА 0 — Подготовка (без изменений кода)

**Цель**: понять масштаб, настроить алиасы, не сломать ничего.

#### 0.1 Проверить алиас `@shared` в vite.config обоих приложений
```js
// vite.config.js — должно быть в обоих
resolve: {
  alias: {
    '@shared': path.resolve(__dirname, '../shared'),
  }
}
```
Если нет — добавить перед началом.

#### 0.2 Убедиться что `@shared` прописан в `jsconfig.json` / `tsconfig.json` для IDE-разрешения путей

#### 0.3 Создать `src/shared/index.js` — главный реэкспорт (если нет)

---

### ФАЗА 1 — Утилиты и хелперы (низкий риск)

**Цель**: убрать `utils/` дубли. Нулевой визуальный эффект, безопасно.

#### 1.1 `permissions.js`
- Оставить в `src/shared/utils/permissions.js`
- Удалить `src/frontend/src/utils/permissions.js`
- Удалить `src/telegram-miniapp/src/utils/permissions.js`
- Заменить импорты на `@shared/utils/permissions`

#### 1.2 `translateApiError.js`
- Аналогично — оставить в shared, убрать из обоих

#### 1.3 `locales.js` — создать в shared
```js
// src/shared/utils/locales.js
export const CATEGORY_RU = { ... }
export const ORDER_STATUS_RU = { ... }
export const ORDER_STATUS_LABEL = { ... }
```
- Удалить из обоих приложений, импортировать из `@shared/utils/locales`

#### 1.4 `useDebounce.js`
- Уже в shared. Оба приложения должны использовать `@shared/utils/useDebounce`
- Удалить все inline debounce реализации

#### 1.5 Утилиты ресторана — создать в shared
```js
// src/shared/utils/restaurant.js
export function isRestaurantOpen(restaurant) { ... }
export function getGreeting() { ... }     // Доброе утро/день/вечер
export function restaurantEmoji(id) { ... } // детерминированный emoji по id
```
Сейчас эти функции дублируются inline в RestaurantPage (обе), HomePage (miniapp), OrdersPage (miniapp).

---

### ФАЗА 2 — Сервисы (средний риск)

**Цель**: все API-вызовы живут в `src/shared/services/`.

#### 2.1 Перенести `api.js` в shared
```js
// src/shared/services/api.js
import axios from 'axios'
const api = axios.create({ baseURL: '/api/v1' })
// interceptors — refresh token, 401 handling
export default api
```
Обе аппки сейчас имеют одинаковый `api.js` — объединяем.

#### 2.2 Перенести все общие сервисы в `src/shared/services/`
Список: `authService`, `cartService`, `favoriteService`, `menuService`,
`orderService`, `promoService`, `restaurantService`, `reviewService`,
`staffService`, `userService`, `vendorService`, `notificationService`

Каждый файл просто переносится; импорты в страницах меняются на `@shared/services/...`

#### 2.3 Оставить в frontend только
- `adminService.js`
- `aiAdvisorService.js`
- `aiOrderService.js` (если есть только в frontend)

#### 2.4 `notificationService` — унифицировать WebSocket
Miniapp имеет WS-версию, frontend — только REST.
```js
// src/shared/services/notificationService.js
export const notificationService = { getAll, markRead, markAllRead }
export function createNotificationWebSocket(token, handlers) { ... }
```
Frontend импортирует только REST-часть, miniapp — и REST и WS.

---

### ФАЗА 3 — Стор (средний риск)

**Цель**: Zustand сторы живут в `src/shared/store/`.

#### 3.1 `useAuthStore` — перенести в shared
Обе версии почти идентичны. Разница:
- miniapp: `isTelegramUser()` флаг и `sessionStorage` вместо `localStorage`
- frontend: `localStorage`

Решение — параметр при создании:
```js
// src/shared/store/useAuthStore.js
export function createAuthStore({ storage = localStorage } = {}) {
  return create(...)
}
// frontend: export default createAuthStore()
// miniapp:  export default createAuthStore({ storage: sessionStorage })
```

#### 3.2 `useOrderStore` — перенести в shared
Разница одна: miniapp показывает `tg.showConfirm()` при смене ресторана.
```js
// src/shared/store/useOrderStore.js
export function createOrderStore({ onRestaurantChange = null } = {}) {
  return create((set, get) => ({
    // ...
    addToCart: async (...) => {
      if (restaurantChanged && onRestaurantChange) {
        const ok = await onRestaurantChange()
        if (!ok) return
      }
      // ...
    }
  }))
}
```
Frontend: `createOrderStore()`
Miniapp: `createOrderStore({ onRestaurantChange: () => tg.showConfirm(...) })`

#### 3.3 `useFavoriteStore` — рефакторить shared версию
`createFavoriteStore.js` в shared → переименовать в `useFavoriteStore.js`,
сделать синглтон. Удалить из frontend и miniapp.

#### 3.4 `useRestaurantStore` — перенести в shared
Идентичны. Простой перенос.

#### 3.5 `useNotificationStore` — оставить в miniapp
Telegram-специфичный (WS), в frontend не нужен как стор.

---

### ФАЗА 4 — UI-компоненты (средний риск)

**Цель**: один источник правды для каждого компонента.

#### 4.1 Компоненты уже в shared — почистить дубли

Для каждого: `EmptyState`, `RestaurantCard`, `MenuItemCard`, `OrderButton`, `Pagination`, `ErrorBoundary`:

1. Сверить shared-версию с frontend-версией и miniapp-версией
2. Взять лучшее из каждой (CSS-модули из miniapp, логика из frontend если лучше)
3. Удалить `src/frontend/src/components/ui/<Компонент>.jsx`
4. Удалить `src/telegram-miniapp/src/components/ui/<Компонент>.jsx`
5. Заменить все импорты на `@shared/components`

#### 4.2 Перенести в shared — новые компоненты

**`ProductSheet`** — модальный лист выбора товара (опции, количество, добавление в корзину)
- Сейчас идентичен в обоих (или почти)
- Перенести в `src/shared/components/ProductSheet/`
- CSS-модули из miniapp-версии берём за основу

**`OrderStatusBadge`** — бейдж статуса заказа
- Перенести в `src/shared/components/OrderStatusBadge/`

**`ConfirmDialog`** — диалог подтверждения
- Есть только в frontend
- Перенести в shared, использовать в miniapp вместо `tg.showConfirm()` (web-fallback)

**`CartDrawer`** — ящик корзины
- В miniapp: две версии (`components/CartDrawer.jsx` и `components/ui/CartDrawer.jsx`) — это баг, надо разобраться
- Объединить в единый `src/shared/components/CartDrawer/`
- Различия:
  - Frontend: поле промокода + комментарий + выбор времени выдачи
  - Miniapp: только комментарий + промокод
  - Решение: пропсы `showSchedule={false}` по умолчанию, frontend включает

#### 4.3 CSS-модули — стандартизировать подход
Miniapp использует `.module.css`. Frontend использует глобальные классы.
**Решение**: все shared компоненты используют CSS-модули.
Компоненты принимают `className` проп для override в конкретном приложении.

---

### ФАЗА 5 — Страницы (высокий приоритет, высокий риск)

**Цель**: вынести бизнес-логику страниц в shared, оставив платформо-специфичные обёртки.

Паттерн для каждой страницы:
```jsx
// src/shared/pages/HomePage/HomePage.jsx — ВСЯ ЛОГИКА ЗДЕСЬ
export function HomePageBase({ 
  renderLayout,      // функция рендера layout (nav, header etc)
  infiniteScroll,    // true (miniapp) | false (frontend → pagination)
  onRestaurantClick, // callback навигации
}) { ... }

// src/frontend/src/pages/home/HomePage.jsx — ТОЛЬКО АДАПТЕР
import { HomePageBase } from '@shared/pages/HomePage'
export default function HomePage() {
  return <HomePageBase infiniteScroll={false} onRestaurantClick={...} />
}

// src/telegram-miniapp/src/pages/home/HomePage.jsx — ТОЛЬКО АДАПТЕР
import { HomePageBase } from '@shared/pages/HomePage'
export default function HomePage() {
  return <HomePageBase infiniteScroll={true} onRestaurantClick={...} />
}
```

#### 5.1 `HomePage`

**Общая логика (в shared)**:
- Стейт: search, sort, direction, onlyOpen, page/infiniteScroll данные
- Debounce поиска
- Загрузка ресторанов через `restaurantService`
- Рендер `RestaurantCard` грида
- Рендер `EmptyState`
- Сортировочные чипсы

**Различия (пропсы)**:
- `mode: 'paginated' | 'infinite'` — тип загрузки
- `showGreeting: boolean` — приветствие с именем (только miniapp)
- `showSearchSpinner: boolean` — спиннер при поиске (только miniapp)
- `filterLayout: 'dropdown' | 'chips'` — фильтры в выпадающем меню (frontend) или чипсы (miniapp)

**UX-улучшения** (применить к обоим):
- Frontend получает infinite scroll (или оставить pagination но добавить кнопку "Загрузить ещё")
- Miniapp уже хороша — оставить как есть
- Оба получают приветствие (frontend без имени или с именем из стора)

#### 5.2 `RestaurantPage`

**Общая логика (в shared)**:
- Загрузка ресторана, меню, категорий
- Управление избранным
- Отзывы (загрузка, создание, удаление)
- Инфо (часы работы)
- `ProductSheet` для товара
- `CartDrawer`

**Различия (пропсы/адаптеры)**:
- `usePortal: boolean` — модали через Portal (miniapp) или инлайн (frontend)
- `onBackPress` — BackButton Telegram или браузерный back
- `haptic` — объект с `impact()`, `notification()` (miniapp) или no-op (frontend)
- Frontend дополнительно: кнопка "Поделиться" + ShareModal, кнопка "Вакансии"

**UX-улучшения** (применить к frontend):
- Скелетоны при загрузке категорий (сейчас есть только в miniapp)
- Emoji placeholder для фото (сейчас есть только в miniapp)
- Компактные пилюли вместо кнопок в hero (опционально для фронта на мобиле)

#### 5.3 `OrdersPage`

**Общая логика (в shared)**:
- Загрузка заказов
- Фильтрация: Все / Активные / Завершённые
- Рендер карточек заказов
- EmptyState

**Различия**:
- `mode: 'paginated' | 'infinite'` — тип загрузки
- `pullToRefresh: boolean` — pull-to-refresh (только miniapp)
- `showRestaurantEmoji: boolean` — emoji ресторана (только miniapp)
- Frontend: 2 фильтра; Miniapp: 3 фильтра → стандартизировать на 3

**UX-улучшения** (применить к frontend):
- Pull-to-refresh (приятнее чем кнопка обновить)
- Emoji ресторана — визуально интереснее
- 3 фильтра вместо 2

#### 5.4 `OrderStatusPage`

**Общая логика (в shared)**:
- WebSocket подключение через `useOrderWebSocket` hook
- `HorizontalSteps` компонент — анимированные шаги
- ETA текст (`useEtaText` hook)
- Кнопки действий (получил / повторить / отменить)
- Состав заказа

**Различия**:
- `haptic` — haptic feedback при смене статуса (только miniapp)
- Цветовые переменные: miniapp использует `--accent`, frontend `--fire` → унифицировать токены

**Перенести в shared**:
- `HorizontalSteps` компонент
- `useEtaText` hook
- `useOrderWebSocket` hook

#### 5.5 `ProfilePage`

**Общая логика (базовая, в shared)**:
- Отображение аватара, имени, телефона
- Счётчики: заказы, избранные
- Меню: Заказы, Избранное, Уведомления, Условия, Политика, Выйти
- Форма редактирования профиля (имя, телефон)

**Frontend-only** (расширение):
- Роли: Admin панель, Staff кабинет, Vendor / стать вендором
- Смена пароля (Email-пользователи)
- Inline настройки с табами

**Miniapp-only** (расширение):
- Переключатель темы
- Проверка `isTelegramUser()` перед показом формы пароля
- Уведомления в меню

#### 5.6 `FavoritesPage`

**Общая логика (в shared)**:
- Загрузка избранных
- Рендер списка ресторанов
- Кнопка удалить из избранного
- EmptyState

**Различия**:
- `pageSize: 20 | 100` — пагинация (frontend) vs всё сразу (miniapp)
- `showHiringBadge: boolean` — бейдж "Вакансии" (только miniapp)
- Frontend: кнопка назад; Miniapp: BackButton Telegram

---

### ФАЗА 6 — Хуки (низкий риск)

**Перенести в `src/shared/hooks/`**:

#### 6.1 `useInfiniteScroll(fetchFn, deps)`
```js
// Абстракция над IntersectionObserver
// Используется в: miniapp/HomePage, miniapp/OrdersPage
// После рефакторинга: shared/pages/HomePage и OrdersPage
```

#### 6.2 `usePullToRefresh(onRefresh)`
```js
// touch события + pullY стейт + анимация
// Используется в: miniapp/OrdersPage
// После рефакторинга: shared/pages/OrdersPage (prop-controlled)
```

#### 6.3 `useOrderWebSocket(orderId, token, handlers)`
```js
// WS подключение к заказу
// Используется в: frontend/OrderStatusPage, miniapp/OrderStatusPage
// После рефакторинга: shared/hooks/
```

#### 6.4 `useEtaText(order)`
```js
// Форматирование ETA
// Используется в: frontend/OrderStatusPage
// После рефакторинга: shared/hooks/
```

---

### ФАЗА 7 — UX-улучшения (применяем к обоим, делаем идентичными)

После объединения кода — улучшаем визуал. Цель: frontend выглядит так же
хорошо как miniapp, а miniapp получает недостающие UX-паттерны.

#### 7.1 Frontend — получает от miniapp
- [ ] **Infinite scroll** на главной (или "Загрузить ещё" кнопка как компромисс)
- [ ] **Pull-to-refresh** на странице заказов
- [ ] **Скелетоны** при загрузке меню ресторана
- [ ] **Emoji placeholder** для ресторанов без фото
- [ ] **Приветствие** "Добрый день, Михаил" на главной (для авторизованных)
- [ ] **Emoji ресторана** в карточках заказов
- [ ] **3 фильтра** на заказах (Все / Активные / Выданные)
- [ ] **Статистика** (заказы, избранные) в профиле

#### 7.2 Miniapp — получает от frontend
- [ ] **ConfirmDialog** как нативный web-fallback (для браузерного тестирования)
- [ ] **QR-код** ресторана (опционально)
- [ ] **Расписание выдачи** в корзине (ASAP / выбрать время)

#### 7.3 Оба — дизайн-система
- [ ] Унифицировать CSS-переменные: `--accent` === `--fire` (сейчас разные имена для одного цвета)
- [ ] CSS-модули везде в shared компонентах
- [ ] Анимации появления карточек (IntersectionObserver + CSS) — уже есть в RestaurantCard shared, но не активировано везде
- [ ] Единый `OrderStatusBadge` с одинаковыми цветами в обоих

---

### ФАЗА 8 — Авторизация (отдельная тема)

Frontend и miniapp имеют принципиально разную auth-логику:
- Frontend: email + password → JWT в `localStorage`
- Miniapp: Telegram initData → JWT в `sessionStorage`

**Решение**:
```js
// src/shared/services/authService.js
export function createAuthService({ adapter }) {
  return {
    login: adapter.login,
    register: adapter.register,
    logout: adapter.logout,
    getToken: adapter.getToken,
    setToken: adapter.setToken,
  }
}

// src/frontend/src/services/authAdapter.js
export const authAdapter = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  getToken: () => localStorage.getItem('token'),
  // ...
}

// src/telegram-miniapp/src/services/authAdapter.js
export const authAdapter = {
  login: (initData) => api.post('/telegram/auth', { initData }),
  getToken: () => sessionStorage.getItem('token'),
  // ...
}
```

`useAuthStore` в shared принимает `adapter` и использует его.

---

## Порядок выполнения (итого)

```
Фаза 0 — алиасы и конфиг                          1 ч
Фаза 1 — утилиты                                   2 ч
Фаза 2 — сервисы                                   3 ч
Фаза 3 — сторы                                     3 ч
Фаза 4 — UI-компоненты (без страниц)               4 ч
Фаза 5.1 — HomePage (shared + адаптеры)            3 ч
Фаза 5.2 — RestaurantPage                          4 ч
Фаза 5.3 — OrdersPage                              2 ч
Фаза 5.4 — OrderStatusPage                         2 ч
Фаза 5.5 — ProfilePage                             2 ч
Фаза 5.6 — FavoritesPage                           1 ч
Фаза 6 — хуки                                      2 ч
Фаза 7 — UX-улучшения                              4 ч
Фаза 8 — auth-адаптеры                             2 ч
──────────────────────────────────────────────────
ИТОГО                                              ~35 ч
```

Каждую фазу можно делать и проверять независимо. Рекомендуется после каждой
фазы запускать оба приложения и проверять что ничего не сломалось.

---

## Правила для shared-компонентов

1. **Нет Telegram SDK** — никакого `window.Telegram` в shared
2. **Нет router-специфики** — компоненты не вызывают `useNavigate` напрямую,
   навигация передаётся через пропс `onNavigate`
3. **CSS-модули** — все компоненты используют `.module.css`
4. **className проп** — все компоненты принимают `className` для переопределения
5. **Нет localStorage/sessionStorage** — storage-логика передаётся через адаптеры
6. **Нет hardcoded API URL** — базовый URL конфигурируется при создании axios-instance

---

## Файлы к созданию (итог)

### `src/shared/` — новые файлы
```
services/api.js
services/authService.js     (перенос + refactor)
services/cartService.js     (перенос)
services/favoriteService.js (перенос)
services/menuService.js     (перенос)
services/orderService.js    (перенос)
services/promoService.js    (перенос)
services/restaurantService.js (перенос)
services/reviewService.js   (перенос)
services/staffService.js    (перенос)
services/userService.js     (перенос)
services/vendorService.js   (перенос)
services/notificationService.js (объединить)
services/index.js

store/useAuthStore.js       (объединить)
store/useOrderStore.js      (объединить + параметризовать)
store/useFavoriteStore.js   (рефакторить из createFavoriteStore)
store/useRestaurantStore.js (перенос)
store/index.js

components/ProductSheet/ProductSheet.jsx
components/ProductSheet/ProductSheet.module.css
components/CartDrawer/CartDrawer.jsx
components/CartDrawer/CartDrawer.module.css
components/OrderStatusBadge/OrderStatusBadge.jsx
components/OrderStatusBadge/OrderStatusBadge.module.css
components/ConfirmDialog/ConfirmDialog.jsx
components/ConfirmDialog/ConfirmDialog.module.css
components/HorizontalSteps/HorizontalSteps.jsx
components/HorizontalSteps/HorizontalSteps.module.css

pages/HomePage/HomePage.jsx
pages/RestaurantPage/RestaurantPage.jsx
pages/OrdersPage/OrdersPage.jsx
pages/OrderStatusPage/OrderStatusPage.jsx
pages/ProfilePage/ProfilePage.jsx
pages/FavoritesPage/FavoritesPage.jsx
pages/index.js

hooks/useInfiniteScroll.js
hooks/usePullToRefresh.js
hooks/useOrderWebSocket.js
hooks/useEtaText.js
hooks/index.js

utils/locales.js            (объединить из обоих)
utils/restaurant.js         (новый)
```

### Файлы к удалению после рефакторинга

```
src/frontend/src/utils/permissions.js
src/frontend/src/utils/translateApiError.js
src/frontend/src/utils/locales.js
src/frontend/src/components/ui/EmptyState.jsx
src/frontend/src/components/ui/ErrorBoundary.jsx
src/frontend/src/components/ui/RestaurantCard.jsx
src/frontend/src/components/ui/MenuItemCard.jsx
src/frontend/src/components/ui/OrderButton.jsx
src/frontend/src/components/ui/Pagination.jsx
src/frontend/src/components/ui/ProductSheet.jsx
src/frontend/src/components/ui/CartDrawer.jsx
src/frontend/src/components/ui/OrderStatusBadge.jsx
src/frontend/src/services/api.js           (если не нужен backend URL)
src/frontend/src/services/authService.js   (заменяется адаптером)
... (большинство services/*.js)
src/frontend/src/store/useAuthStore.js
src/frontend/src/store/useOrderStore.js
src/frontend/src/store/useFavoriteStore.js
src/frontend/src/store/useRestaurantStore.js

src/telegram-miniapp/src/utils/permissions.js
src/telegram-miniapp/src/utils/translateApiError.js
src/telegram-miniapp/src/utils/locales.js
src/telegram-miniapp/src/components/ui/EmptyState.jsx
src/telegram-miniapp/src/components/ui/ErrorBoundary.jsx
src/telegram-miniapp/src/components/ui/RestaurantCard.jsx
src/telegram-miniapp/src/components/ui/MenuItemCard.jsx
src/telegram-miniapp/src/components/ui/OrderButton.jsx
src/telegram-miniapp/src/components/ui/Pagination.jsx
src/telegram-miniapp/src/components/ui/ProductSheet.jsx
src/telegram-miniapp/src/components/ui/CartDrawer.jsx  (и корневой CartDrawer.jsx)
src/telegram-miniapp/src/components/ui/OrderStatusBadge.jsx
src/telegram-miniapp/src/services/api.js
src/telegram-miniapp/src/services/authService.js
... (большинство services/*.js)
src/telegram-miniapp/src/store/useAuthStore.js
src/telegram-miniapp/src/store/useOrderStore.js
src/telegram-miniapp/src/store/useFavoriteStore.js
src/telegram-miniapp/src/store/useRestaurantStore.js
```

---

## Итог: что останется уникальным

| | Frontend | Miniapp |
|--|--|--|
| Роутинг | 11 маршрутов + роли | 6 маршрутов |
| Навигация | Header + FAB | BottomNav |
| Auth-адаптер | email/password | Telegram initData |
| Haptic | нет | да |
| BackButton | браузерный | Telegram SDK |
| Страницы | + vendor/admin/staff/display | + notifications |
| Корзина | + расписание выдачи | базовая |
| Тема | ThemeToggle в header | переключатель в профиле |
| WS-стор | нет | useNotificationStore |
| Telegram SDK | нет | `telegram/sdk.js`, `telegram/init.js` |
| ActiveOrderBanner | нет | да |
