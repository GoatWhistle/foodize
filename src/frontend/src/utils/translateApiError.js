const ERROR_MAP = {
  "You have already reviewed this restaurant":
    "Вы уже оставили отзыв на этот ресторан",
  "Duplicate entry: this information already exists":
    "Вы уже оставили отзыв на этот ресторан",
  "You can only review restaurants where you have a completed order":
    "Отзыв можно оставить только при наличии завершённого заказа",
  "You already have a pending request for this restaurant.":
    "У вас уже есть активная заявка на этот ресторан",
  "Your previous request was rejected. Please try again after 24 hours.":
    "Ваша предыдущая заявка была отклонена. Повторная подача возможна через 24 часа",
  "You are already a staff member at this restaurant.":
    "Вы уже являетесь сотрудником этого ресторана",
  "You are not a hiring restaurant.":
    "Этот ресторан не принимает заявки на сотрудников",
  "Staff request not found": "Заявка не найдена",
  "Restaurant is already in favorites": "Ресторан уже добавлен в избранное",
  "Favorite not found": "Запись в избранном не найдена",
  "Order not found": "Заказ не найден",
  "You do not have permission to access this order":
    "У вас нет доступа к этому заказу",
  "One or more menu items were not found":
    "Один или несколько товаров не найдены",
  "One or more menu items do not belong to the specified restaurant":
    "Один или несколько товаров не принадлежат этому ресторану",
  "Order can only be cancelled when in PENDING status":
    "Отменить заказ можно только в статусе «Ожидает»",
  "Invalid order status transition": "Недопустимое изменение статуса заказа",
  "One or more menu items are not available":
    "Один или несколько товаров недоступны для заказа",
  "Order can only be completed when in READY status":
    "Подтвердить получение можно только в статусе «Готов»",
  "Restaurant not found": "Ресторан не найден",
  "Restaurant is currently closed": "Ресторан сейчас закрыт",
  "Duplicate options selected": "Одна и та же опция выбрана дважды",
  "Selected option not found":
    "Одна из выбранных опций больше недоступна. Обновите меню и попробуйте снова",
  "Selected option does not belong to menu item":
    "Одна из выбранных опций не относится к этому блюду",
  "Selected option is not available":
    "Одна из выбранных опций сейчас недоступна",
  "Not enough options selected": "Выберите обязательные опции блюда",
  "Too many options selected": "Выбрано слишком много опций для блюда",
  "Only one option can be selected":
    "В этой группе можно выбрать только одну опцию",
  "User already has a vendor profile": "У вас уже есть профиль вендора",
  "User with this phone number already exists":
    "Пользователь с таким номером телефона уже существует",
  "Menu item not found": "Товар не найден",
  "Promo code not found": "Промокод не найден",
  "Promo code is not active or has expired": "Промокод неактивен или истёк",
  "Promo code is not valid for this restaurant":
    "Промокод не действителен для этого ресторана",
  "Promo code usage limit has been reached":
    "Лимит использования промокода исчерпан",
  "Promo code already exists": "Промокод с таким кодом уже существует",
  "Only VENDOR and STAFF can access orders":
    "Доступ только для вендоров и сотрудников",
};

export function translateApiError(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (detail && typeof detail === "string") {
    const exact = ERROR_MAP[detail];
    if (exact) return exact;
    const prefix = Object.keys(ERROR_MAP).find((key) => detail.startsWith(key));
    return prefix ? ERROR_MAP[prefix] : detail;
  }
  return fallback;
}
