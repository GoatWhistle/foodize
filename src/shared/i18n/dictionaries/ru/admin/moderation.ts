export const adminOrders = {
  searchPlaceholder: "Клиент, телефон или ресторан",
  emptyTitle: "Заказов пока нет",
  filters: {
    all: "Все",
    pending: "Новые",
    accepted: "Принятые",
    ready: "Готовы",
    completed: "Выданы",
  },
  card: {
    title: "Заказ #{displayId}",
    customerFallback: "Клиент",
  },
  errors: {
    loadFailed: "Не удалось загрузить заказы",
  },
} as const;

export const adminResolution = {
  title: "Центр Модерации",
  subtitle: "Инструменты ручной отмены и возврата средств для любых заказов.",
  searchPlaceholder: "ID заказа, телефон клиента",
  allStatuses: "Все статусы",
  statuses: {
    pending: "Новые",
    accepted: "Принятые",
    ready: "Готовы",
    completed: "Выданы (Требуют возврата?)",
  },
  orderTitle: "Заказ #{displayId}",
  customerFallback: "Клиент",
  details: "Подробности",
  forceCancel: "Принудительная отмена / Возврат",
  emptyTitle: "Проблемных заказов не найдено",
  dialogs: {
    forceCancelTitle: "Принудительная отмена",
    forceCancelMessage: "Вы уверены, что хотите отменить заказ #{displayId}?",
    forceCancelConfirm: "Отменить",
  },
  errors: {
    cancelFailed: "Не удалось отменить заказ. Попробуйте ещё раз.",
  },
} as const;
