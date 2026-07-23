export const vendorAdvisor = {
  insightsTitle: "Анализ бизнеса",
  analyzing: "Анализирую…",
  getInsights: "Получить анализ",
  chatTitle: "Спросить аналитика",
  inputPlaceholder: "Например: что добавить в меню?",
  suggestions: {
    whatToAdd: "Что добавить в меню?",
    peakHours: "Когда у меня пиковые часы?",
    unpopularItems: "Какие позиции почти не покупают?",
    raiseAov: "Как поднять средний чек?",
  },
  errors: {
    chatFailed: "Не удалось получить ответ. Проверьте подключение и ключ модели.",
    insightsFailed: "Не удалось получить анализ бизнеса.",
  },
} as const;

export const vendorAssistant = {
  launcher: "Помощник",
  ariaLabel: "Помощник заказа",
  title: "Помощник заказа",
  intro: "Спросите, что хотите заказать — найду и помогу оформить.",
  inputPlaceholder: "Что хотите заказать?",
  sendAriaLabel: "Отправить сообщение",
  suggestions: {
    cheapSpicyShaurma: "Где острая шаурма дешевле 350?",
    twoBurgersAndCola: "Хочу два бургера и колу",
    dessert: "Что есть на десерт?",
  },
  errors: {
    requestFailed: "Не удалось получить ответ. Попробуйте ещё раз.",
  },
} as const;
