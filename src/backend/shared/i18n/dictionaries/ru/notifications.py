from shared.i18n.types import TranslationTree

NOTIFICATIONS: TranslationTree = {
    "orderReady": {
        "title": "Заказ готов!",
        "message": "Ваш заказ из {restaurant} готов к выдаче. Приятного аппетита!",
    },
    "orderStatusChanged": {
        "title": "Статус заказа изменён",
        "message": "Ваш заказ из {restaurant} теперь в статусе: {status}.",
    },
    "feedbackRequested": {
        "title": "Оцените ваш заказ",
        "message": (
            "Как вам заказ из {restaurant}? Пожалуйста, оставьте отзыв"
            " в мини-приложении, это поможет ресторану стать лучше!"
        ),
    },
    "orderPlaced": {
        "title": "Заказ в {restaurant} принят",
        "message": "Ваш заказ на сумму {total} ₽ успешно оформлен и ожидает подтверждения.",
    },
    "orderStatus": {
        "PENDING": "Ожидается",
        "ACCEPTED": "Принят",
        "READY": "Готово",
        "COMPLETED": "Выполнено",
        "CANCELLED": "Отменён",
    },
}
