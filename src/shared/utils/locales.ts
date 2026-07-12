export const ORDER_STATUS_RU = {
  PENDING: "Ожидается",
  ACCEPTED: "Принят",
  PREPARING: "Готовится",
  COOKING: "Готовится",
  READY: "Готов к выдаче",
  COMPLETED: "Выдан",
  CANCELLED: "Отменён",
};

export const ORDER_STATUS_CUSTOMER_RU = {
  PENDING: "Принимается",
  ACCEPTED: "Готовится",
  PREPARING: "Готовится",
  COOKING: "Готовится",
  READY: "Готов к выдаче",
  COMPLETED: "Выдан",
  CANCELLED: "Отменён",
};

export const APPROVAL_STATUS_RU = {
  PENDING: "На модерации",
  APPROVED: "Одобрен",
  REJECTED: "Отклонён",
};

export const CATEGORY_RU = {
  SHAURMA: "Шаурма",
  BURGER: "Бургеры",
  DRINK: "Напитки",
  PIZZA: "Пицца",
  SUSHI: "Суши",
  DESSERT: "Десерты",
  SNACK: "Снеки",
  SALAD: "Салаты",
  OTHER: "Разное",
};

export const DISCOUNT_TYPE_RU = {
  PERCENT: "Процент",
  FIXED: "Сумма",
};

export const STAFF_STATUS_RU = {
  PENDING: "Новая заявка",
  APPROVED: "Принят",
  REJECTED: "Отклонён",
  REVOKED: "Отозван",
};

export const STAFF_ROLE_RU = {
  COOK: "Повар",
};

export const translate = (
  dict: Record<string, string>,
  key: string | null | undefined,
  fallback = "",
): string => {
  if (!key) return fallback;
  return dict[key] ?? fallback;
};
