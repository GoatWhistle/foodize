export const vendorOrders = {
  toolbarTitle: "Заказы заведения",
  toolbarHint: "Новые заказы обновляются автоматически",
  resetPeriod: "Сбросить период",
  dateFrom: "Дата с",
  dateTo: "Дата по",
  filters: {
    all: "Все",
    pending: "Новые",
    accepted: "Принятые",
    ready: "Готовые",
    completed: "Выданные",
  },
  nextLabel: {
    accept: "Принять",
    ready: "Готово",
    complete: "Выдать",
  },
  emptyTitle: "Нет заказов",
  emptySubtitleFiltered: "В этом статусе заказов нет",
  emptySubtitle: "Пока никто не сделал заказ",
  card: {
    title: "Заказ #{displayId}",
    itemsAndTotal: "{count} позиц. • {total}",
    pickupAt: " • к выдаче {time}",
  },
  errors: {
    loadFailed:
      "Не удалось загрузить заказы. Проверьте, что аккаунт вендора имеет доступ к этому заведению.",
    statusChangeFailed: "Не удалось изменить статус заказа",
    cancelFailed: "Не удалось отменить заказ",
  },
} as const;

export const vendorAnalytics = {
  presets: {
    today: "Сегодня",
    days3: "3 дня",
    days7: "7 дней",
    days30: "30 дней",
    halfYear: "Полгода",
    year: "Год",
    reset: "Сбросить",
  },
  financePdf: "Финансы PDF",
  analyticsPdf: "Аналитика PDF",
  orderStatus: {
    completed: "Завершены",
    inProgress: "В процессе",
    cancelled: "Отменены",
  },
} as const;

export const vendorPromos = {
  sectionTitle: "Промокоды",
  emptyTitle: "Нет промокодов",
  emptySubtitle: "Создайте первый промокод для скидки клиентам",
  formTitle: "Новый промокод",
  placeholders: {
    code: "Код (напр. SAVE20)",
    discountPercent: "Скидка %",
    discountFixed: "Сумма ₽",
    maxUses: "Макс. использований (не обяз.)",
    expiresAt: "Истекает (не обяз.)",
    minAmount: "Мин. сумма (не обяз.)",
    allCategories: "Все категории",
  },
  discountTypePercent: "% Процент",
  discountTypeFixed: "₽ Фиксированный",
  firstOrderOnlyCheckbox: "Только для первого заказа",
  creating: "Создаю...",
  card: {
    firstOrderOnly: "только первый заказ",
    minAmount: "от {amount}",
    usage: "{used}/{max} исп.",
    unlimited: "∞",
    expires: " • до {date}",
    conditions: "Условия: {conditions}",
    active: "Активен",
    finished: "Завершён",
    deactivate: "Деактивировать",
  },
  messages: {
    created: "Промокод создан",
  },
  errors: {
    loadFailed: "Не удалось загрузить промокоды",
    createFailed: "Ошибка создания промокода",
    deactivateFailed: "Не удалось деактивировать промокод",
  },
} as const;
