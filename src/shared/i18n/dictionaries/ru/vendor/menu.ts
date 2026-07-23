export const vendorRestaurants = {
  sectionTitle: "Мои заведения",
  waitApproval: "Дождитесь одобрения профиля",
  newFormTitle: "Новое заведение",
  emptyTitle: "Нет заведений",
  emptySubtitle: "Добавьте первое заведение",
  placeholders: {
    avgPrepTime: "Среднее время приготовления, минут",
    maxActiveOrders: "Мягкий лимит активных заказов",
  },
} as const;

export const vendorMenu = {
  sectionTitle: "Позиции меню",
  addItem: "Позиция",
  emptyTitle: "Меню пустое",
  emptySubtitle: "Добавьте первую позицию",
  stopBadge: "СТОП",
  on: "ВКЛ",
  off: "ВЫКЛ",
  availableToggleOn: "Доступно (сделать недоступным)",
  availableToggleOff: "Недоступно (сделать доступным)",
  form: {
    editTitle: "Редактировать",
    newTitle: "Новая позиция",
  },
  photo: {
    alt: "Фото блюда",
    replace: "Заменить фото",
    upload: "Загрузить фото",
    remove: "Удалить фото",
    hint: "JPEG, PNG или WebP · до 5 МБ",
  },
  options: {
    title: "Опции блюда",
    hint: "Например: убрать лук, добавить мясо",
    addGroup: "Группа",
    addOption: "Опция",
    groupNamePlaceholder: "Название группы",
    optionPlaceholder: "Опция",
    maxChoicesPlaceholder: "Макс. выборов",
    multiple: "Несколько",
    single: "Один вариант",
    required: "Обязательный выбор",
  },
  messages: {
    itemUpdated: "Позиция обновлена",
    itemAdded: "Позиция добавлена",
    deleteTitle: "Удалить позицию?",
    deleteMessage: "Вы уверены, что хотите удалить эту позицию из меню?",
  },
  errors: {
    saveFailed: "Ошибка сохранения",
    deleteFailed: "Не удалось удалить позицию",
  },
} as const;
