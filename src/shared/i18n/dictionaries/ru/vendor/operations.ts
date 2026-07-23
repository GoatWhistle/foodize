export const vendorSchedule = {
  sectionTitle: "Расписание работы",
  saving: "Сохранение...",
  dayOff: "Выходной",
  dayOffShort: "Вых.",
  errors: {
    loadFailed: "Не удалось загрузить расписание",
    saveFailed: "Не удалось сохранить расписание",
  },
} as const;

export const vendorSettings = {
  sectionTitle: "Настройки ресторана",
  descriptionLabel: "Описание ресторана",
  descriptionPlaceholder: "Краткое описание заведения для посетителей...",
  isOpen: "Заведение открыто",
  orderingPaused: "Пауза приёма заказов",
  pausedUntil: "Пауза до",
  avgPrepTime: "Среднее время приготовления, минут",
  maxActiveOrders: "Мягкий лимит активных заказов",
  noLimit: "Без лимита",
  isHiring: "Набор сотрудников",
  cover: {
    title: "Обложка ресторана",
    alt: "Обложка ресторана",
    loading: "Загрузка…",
    replace: "Заменить обложку",
    upload: "Загрузить обложку",
    hint: "JPEG, PNG или WebP · до 5 МБ",
    description:
      "Показывается широким баннером в шапке страницы ресторана. Лучше всего подходит горизонтальное фото (например, интерьер или блюдо крупным планом) шириной от 1200 px — вертикальные будут сильно обрезаны.",
    uploadFailed: "Не удалось загрузить фото",
    deleteFailed: "Не удалось удалить фото",
  },
  errors: {
    nameRequired: "Укажите название заведения",
    addressRequired: "Укажите адрес заведения",
    createFailed: "Ошибка создания",
    updateFailed: "Ошибка обновления",
  },
} as const;

export const vendorStaff = {
  tabs: {
    members: "Сотрудники",
    requests: "Заявки",
  },
  emptyMembersTitle: "Нет сотрудников",
  emptyMembersSubtitle: "Принятые сотрудники появятся здесь",
  emptyRequestsTitle: "Нет заявок",
  emptyRequestsSubtitle: "Заявки появятся здесь",
  noPhone: "Нет телефона",
  idFallback: "ID: {id}",
  requestUser: "Пользователь #{id}",
  confirmRemove: "Уволить сотрудника?",
} as const;
