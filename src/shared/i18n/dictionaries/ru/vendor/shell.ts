export const vendorDashboard = {
  title: "Дашборд вендора",
} as const;

export const vendorSidebar = {
  ariaLabel: "Разделы вендора",
  tabs: {
    menu: "Меню",
    orders: "Заказы",
    analytics: "Аналитика",
    ai: "ИИ-аналитик",
    promos: "Промокоды",
    loyalty: "Лояльность",
    schedule: "Расписание",
    staff: "Сотрудники",
    settings: "Настройки",
  },
  openDisplayBoard: "Открыть табло",
  qrSite: "QR для сайта",
  qrTelegram: "QR для Telegram",
} as const;

export const vendorApprovalBanner = {
  pendingTitle: "Профиль на модерации",
  rejectedTitle: "Профиль отклонён",
  pendingText:
    "Ваш профиль проверяется администратором. Ваши заведения пока не видны покупателям.",
  rejectedText: "К сожалению, ваш профиль не прошел модерацию.",
  reason: "Причина: {reason}",
} as const;

export const vendorExportFiles = {
  menu: "меню_{date}.csv",
  orders: "заказы_{date}.csv",
  finance: "финансы_{restaurant}_{range}.pdf",
  analytics: "аналитика_{restaurant}_{range}.pdf",
  allRestaurants: "все",
} as const;

export const vendorErrors = {
  exportFailed: "Не удалось выполнить экспорт",
} as const;
