from infra.llm import ToolSpec

ORDER_TOOLS: list[ToolSpec] = [
    ToolSpec(
        name="search_menu",
        description=(
            "Найти позиции меню по тексту запроса (название/описание), с фильтром по "
            "максимальной цене и/или конкретному ресторану. Возвращает menu_item_id, "
            "цену, ресторан и адрес."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Что ищем, напр. 'острая шаурма'."},
                "max_price": {"type": "integer", "description": "Максимальная цена в рублях."},
                "restaurant_id": {"type": "string", "description": "UUID ресторана (опц.)."},
            },
            "required": ["query"],
        },
    ),
    ToolSpec(
        name="view_cart",
        description="Показать текущую корзину пользователя и итоговую сумму.",
        input_schema={"type": "object", "properties": {}},
    ),
    ToolSpec(
        name="add_to_cart",
        description=(
            "Добавить позицию в корзину. Корзина может содержать позиции только одного "
            "ресторана — если в ней товары из другого, сначала очистить (clear_cart)."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "menu_item_id": {"type": "string", "description": "UUID позиции меню."},
                "quantity": {"type": "integer", "description": "Количество (1–99), по умолч. 1."},
                "option_ids": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "UUID выбранных опций (опц.).",
                },
            },
            "required": ["menu_item_id"],
        },
    ),
    ToolSpec(
        name="remove_from_cart",
        description="Убрать позицию из корзины по menu_item_id.",
        input_schema={
            "type": "object",
            "properties": {"menu_item_id": {"type": "string"}},
            "required": ["menu_item_id"],
        },
    ),
    ToolSpec(
        name="clear_cart",
        description="Полностью очистить корзину.",
        input_schema={"type": "object", "properties": {}},
    ),
    ToolSpec(
        name="place_order",
        description=(
            "Оформить заказ из текущей корзины. Перед этим подтвердите состав у пользователя. "
            "Требует, чтобы view_cart был вызван после последнего изменения корзины — иначе "
            "вернётся ошибка cart_not_confirmed."
        ),
        input_schema={
            "type": "object",
            "properties": {
                "comment": {"type": "string", "description": "Комментарий к заказу (опц.)."},
                "promo_code": {"type": "string", "description": "Промокод (опц.)."},
            },
        },
    ),
]
