export const adminFinance = {
  allRestaurants: "Все рестораны",
  presets: {
    today: "Сегодня",
    days3: "3 дня",
    days7: "7 дней",
    days30: "30 дней",
    halfYear: "Полгода",
    year: "Год",
    reset: "Сбросить",
  },
  exports: {
    financePdf: "Финансы PDF",
    analyticsPdf: "Аналитика PDF",
    overviewPdf: "Обзор платформы PDF",
  },
  topRestaurantsHidden: "Топ ресторанов скрыт — активен фильтр по ресторану",
  resetFilter: "Сбросить фильтр",
  errors: {
    loadFailed: "Не удалось загрузить аналитику",
  },
} as const;

export const adminCharts = {
  revenue: {
    title: "Динамика выручки",
    series: "Выручка",
  },
  aovDynamics: {
    title: "Динамика среднего чека",
    series: "Средний чек",
  },
  categoryRevenue: {
    title: "Выручка по категориям",
  },
  hourlyLoad: {
    title: "Нагрузка по часам",
    series: "Заказы",
  },
  orderStatus: {
    title: "Статусы заказов",
  },
  topItems: {
    title: "Топ 5 блюд",
    soldUnits: "Продано шт.",
  },
  topRestaurants: {
    title: "Топ 5 ресторанов",
    revenue: "Выручка",
  },
  usersByRole: {
    customer: "Клиенты",
    staff: "Персонал",
    vendor: "Вендоры",
    percentOfAll: "{percent}% от всех",
  },
  kpi: {
    revenue: "Выручка",
    growth: "Рост",
    growthSub: "vs. прошлый период",
    orders: "Заказов",
    averageCheck: "Средний чек",
    averageCheckValue: "{value} ₽",
    conversion: "Конверсия",
    conversionValue: "{value}%",
    cancelled: "Отменено",
    cancelledSub: "{percent}% от всех",
  },
} as const;

export const adminExportFiles = {
  users: "пользователи_{date}.csv",
  orders: "заказы_{date}.csv",
  restaurants: "рестораны_{date}.csv",
  vendors: "вендоры_{date}.csv",
  reviews: "отзывы_{date}.csv",
  finance: "финансы_{restaurant}_{range}.pdf",
  analytics: "аналитика_{restaurant}_{range}.pdf",
  overview: "обзор_платформы_{date}.pdf",
  allRestaurants: "все",
} as const;
