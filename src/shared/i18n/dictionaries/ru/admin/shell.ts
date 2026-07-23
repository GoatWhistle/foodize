export const adminSidebar = {
  title: "Админ-панель",
  ariaLabel: "Разделы админ-панели",
  entities: "Сущности",
  tabs: {
    stats: "Статистика",
    users: "Пользователи",
    orders: "Заказы",
    resolution: "Модерация",
    restaurants: "Рестораны",
    vendors: "Вендоры",
    reviews: "Отзывы",
    finance: "Аналитика",
    audit: "Логи",
  },
} as const;

export const adminCommon = {
  selectAll: "Выбрать все",
  emptySubtitle: "Для выбранных фильтров нет результатов",
  anyStatus: "Любой статус",
} as const;

export const adminBatch = {
  selected: "Выбрано: {count} {label}",
  labels: {
    users: "пользователей",
    reviews: "отзывов",
    vendors: "вендоров",
    restaurants: "ресторанов",
  },
  actions: {
    activate: "Активировать",
    deactivate: "Деактивировать",
    deleteSelected: "Удалить выбранные",
    approveSelected: "Одобрить выбранных",
    rejectSelected: "Отклонить выбранных",
  },
} as const;

export const adminReasonDialog = {
  placeholder: "Напишите причину отклонения",
  running: "Выполняю...",
} as const;

export const adminStats = {
  cards: {
    users: "Пользователи",
    restaurants: "Рестораны",
    orders: "Заказы",
    vendors: "Вендоры",
  },
  growth: "+{count} за последние 14 дней",
} as const;

export const adminErrors = {
  statsLoadFailed: "Не удалось загрузить статистику",
  exportFailed: "Не удалось выполнить экспорт",
} as const;
