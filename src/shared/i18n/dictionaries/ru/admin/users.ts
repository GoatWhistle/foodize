export const adminUsers = {
  searchPlaceholder: "Поиск по имени или телефону",
  allRoles: "Все роли",
  emptyTitle: "Пользователей пока нет",
  card: {
    noName: "Без имени",
    noPhone: "Нет телефона",
    active: "Активен",
    blocked: "Заблокирован",
    blockTitle: "Заблокировать",
  },
  modal: {
    fallbackTitle: "Пользователь",
    subtitle: "Детали профиля",
    roleManagement: "Управление ролью",
    makeAdmin: "Сделать админом",
    unblock: "Разблокировать",
    block: "Заблокировать пользователя",
  },
  dialogs: {
    blockTitle: "Заблокировать пользователя?",
    blockMessage:
      "Пользователь больше не сможет пользоваться аккаунтом, пока вы его не разблокируете.",
    blockConfirm: "Заблокировать",
    makeAdminTitle: "Сделать пользователя админом?",
    makeAdminMessage:
      "Точно ли вы хотите дать этому пользователю права администратора?",
    makeAdminConfirm: "Сделать админом",
    setPresetTitle: "Установить роль: {preset}?",
    setPresetMessage: "Права пользователя будут заменены на пресет «{preset}».",
    setPresetConfirm: "Изменить",
    batchDeactivateTitle: {
      one: "Деактивировать {count} пользователя?",
      few: "Деактивировать {count} пользователей?",
      many: "Деактивировать {count} пользователей?",
    },
    batchDeactivateMessage: "Они потеряют доступ к аккаунту.",
    batchDeactivateConfirm: "Деактивировать",
  },
  messages: {
    batchDone: {
      one: "Готово: {count} пользователь",
      few: "Готово: {count} пользователя",
      many: "Готово: {count} пользователей",
    },
  },
  errors: {
    loadFailed: "Не удалось загрузить пользователей",
    detailsFailed: "Не удалось загрузить детали пользователя",
    blockFailed: "Не удалось заблокировать пользователя",
    unblockFailed: "Не удалось разблокировать пользователя",
    roleChangeFailed: "Не удалось изменить роль",
    batchFailed: "Ошибка при массовом действии",
  },
} as const;
