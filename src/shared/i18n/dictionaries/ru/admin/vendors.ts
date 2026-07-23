export const adminVendors = {
  searchPlaceholder: "Вендор или телефон",
  allStatuses: "Все статусы",
  statuses: {
    pending: "На проверке",
    approved: "Одобрен",
    rejected: "Отклонён",
  },
  emptyTitle: "Вендоров пока нет",
  noName: "Вендор без имени",
  noPhone: "Нет телефона",
  restaurantsCount: {
    one: "{count} заведение",
    few: "{count} заведения",
    many: "{count} заведений",
  },
  modal: {
    fallbackTitle: "Вендор",
    subtitle: "Детали вендора",
    fields: {
      profileId: "ID профиля",
      userId: "ID пользователя",
      restaurants: "Рестораны",
      moderation: "Модерация",
    },
    deleteVendor: "Удалить вендора",
  },
  dialogs: {
    deleteTitle: "Удалить вендора?",
    deleteMessage: "Точно ли вы хотите удалить вендора? Его рестораны будут скрыты.",
    deleteConfirm: "Удалить вендора",
    approveTitle: "Одобрить вендора?",
    approveMessage:
      "После одобрения вендор сможет работать в кабинете и управлять заведениями.",
    rejectTitle: "Отклонить вендора",
    rejectMessage:
      "Укажите причину отказа, чтобы заявка не выглядела как молчаливый отказ.",
    rejectReasonTitle: "Причина отклонения",
  },
  messages: {
    approved: "Вендор одобрен",
    rejected: "Вендор отклонён",
    batchDone: {
      one: "Готово: {count} вендор",
      few: "Готово: {count} вендора",
      many: "Готово: {count} вендоров",
    },
  },
  errors: {
    loadFailed: "Не удалось загрузить вендоров",
    detailsFailed: "Не удалось загрузить детали вендора",
    deleteFailed: "Не удалось удалить вендора",
    approveFailed: "Не удалось одобрить вендора",
    rejectFailed: "Не удалось отклонить вендора",
    batchFailed: "Ошибка при массовом действии",
  },
} as const;
