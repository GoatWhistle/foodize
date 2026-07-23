export const adminReviews = {
  allRatings: "Все",
  emptyTitle: "Отзывов пока нет",
  verifiedPurchase: "Покупка подтверждена",
  deleteTitle: "Удалить отзыв",
  dialogs: {
    deleteTitle: "Удалить отзыв?",
    deleteMessage: "Точно ли вы хотите удалить отзыв? Он исчезнет из карточки ресторана.",
    deleteConfirm: "Удалить отзыв",
    batchDeleteTitle: {
      one: "Удалить {count} отзыв?",
      few: "Удалить {count} отзыва?",
      many: "Удалить {count} отзывов?",
    },
    batchDeleteMessage: "Это действие необратимо.",
  },
  messages: {
    batchDeleted: {
      one: "Удалено: {count} отзыв",
      few: "Удалено: {count} отзыва",
      many: "Удалено: {count} отзывов",
    },
  },
  errors: {
    loadFailed: "Не удалось загрузить отзывы",
    deleteFailed: "Не удалось удалить отзыв",
    batchDeleteFailed: "Ошибка при удалении",
  },
} as const;

export const adminAudit = {
  allActions: "Все действия",
  allEntities: "Все объекты",
  entityVendor: "Вендор",
  entityRestaurant: "Ресторан",
  entity: "Объект: {id}",
  emptyTitle: "Логов пока нет",
  actions: {
    APPROVE_VENDOR: "Одобрен вендор",
    REJECT_VENDOR: "Отклонён вендор",
    DEACTIVATE_VENDOR: "Деактивирован вендор",
    APPROVE_RESTAURANT: "Одобрен ресторан",
    REJECT_RESTAURANT: "Отклонён ресторан",
    DEACTIVATE_USER: "Деактивирован пользователь",
    ACTIVATE_USER: "Активирован пользователь",
    UPDATE_PERMISSIONS: "Изменены права пользователя",
    CREATE_MENU_ITEM: "Создан пункт меню",
    UPDATE_MENU_ITEM: "Изменён пункт меню",
    DELETE_MENU_ITEM: "Удалён пункт меню",
    TOGGLE_MENU_ITEM: "Изменена доступность пункта меню",
    CREATE_PROMO: "Создан промокод",
    DEACTIVATE_PROMO: "Деактивирован промокод",
    FORCE_CANCEL_ORDER: "Заказ отменён администратором",
    DELETE_REVIEW: "Удален отзыв",
  },
  errors: {
    loadFailed: "Не удалось загрузить логи",
  },
} as const;
