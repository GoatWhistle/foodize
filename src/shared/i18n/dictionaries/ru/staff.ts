export const staff = {
  dashboard: {
    title: "Кабинет сотрудника",
    roleLabel: "Роль:",
    newOrderAlert: "Новый заказ!",
    autoEta: "Авто-время по блюдам",
    tabs: {
      orders: "Заказы",
      menu: "Стоп-лист",
    },
  },
  columns: {
    pending: "Новые",
    accepted: "Принято",
    ready: "Готово",
    empty: "Пусто",
    ariaGroup: "Колонка «{label}», заказов: {count}",
  },
  card: {
    ariaRoledescription: "Перетаскиваемая карточка заказа",
    ariaLabel: "Заказ №{displayId}, статус: {status}",
    pickupAt: "Ко времени:",
    etaExpired: "время вышло",
    etaApprox: "~{minutes} мин",
    elapsedMinutes: "{minutes}м",
    next: {
      accept: "Принять",
      ready: "Готов",
      complete: "Выдать",
    },
    cancel: {
      reasonPlaceholder: "Причина отмены (необязательно)",
    },
  },
  delayedBanner: {
    orders: {
      one: "{count} заказ задерживается",
      few: "{count} заказа задерживается",
      many: "{count} заказов задерживается",
    },
    hint: "— проверьте принятые",
  },
  etaModal: {
    title: "Заказ #{displayId}",
    subtitle: "Выберите время готовности",
    chipMinutes: "{minutes} мин",
    recommendedMark: " *",
    manualLabel: "Или указать точное время",
    recommendedHint: "* — рекомендовано по составу заказа",
    confirm: "Начать готовить",
  },
  menuTab: {
    emptyTitle: "Меню пусто",
    emptySubtitle: "В этом ресторане пока нет блюд",
    on: "ВКЛ",
    off: "ВЫКЛ",
  },
  application: {
    noProfileTitle: "Нет профиля сотрудника",
    noProfileSubtitle:
      "Вы не привязаны ни к одному заведению. Обратитесь к менеджеру.",
    number: "Заявка #{id}",
    pending: {
      title: "Заявка на рассмотрении",
      description:
        "Ваша заявка отправлена и ожидает решения менеджера. Обычно это занимает несколько часов.",
    },
    accepted: {
      title: "Заявка одобрена",
      description:
        "Ваша заявка принята. Обратитесь к менеджеру для завершения оформления.",
    },
    rejected: {
      title: "Заявка отклонена",
      description:
        "К сожалению, ваша заявка была отклонена. Вы можете попробовать снова через 24 часа.",
    },
  },
  errors: {
    menuLoadFailed: "Не удалось загрузить меню",
    statusUpdateFailed: "Не удалось обновить статус",
    acceptOrderFailed: "Не удалось принять заказ",
    cancelOrderFailed: "Не удалось отменить заказ",
    toggleAvailabilityFailed: "Не удалось изменить статус блюда",
  },
  displayBoard: {
    cooking: "Готовятся",
    ready: "Готовы к выдаче",
    empty: "Пусто",
    noAccess: "Нет доступа",
    connectionError: "Ошибка подключения",
  },
} as const;
