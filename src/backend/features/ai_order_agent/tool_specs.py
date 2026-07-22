from infra.llm import ToolSpec
from shared.i18n import DEFAULT_LANGUAGE, translate


def build_order_tools(language: str = DEFAULT_LANGUAGE) -> list[ToolSpec]:
    return [
        ToolSpec(
            name="search_menu",
            description=translate("prompts.order.tools.searchMenu", language),
            input_schema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": translate("prompts.order.tools.searchQuery", language),
                    },
                    "max_price": {
                        "type": "integer",
                        "description": translate("prompts.order.tools.searchMaxPrice", language),
                    },
                    "restaurant_id": {
                        "type": "string",
                        "description": translate(
                            "prompts.order.tools.searchRestaurantId", language
                        ),
                    },
                },
                "required": ["query"],
            },
        ),
        ToolSpec(
            name="view_cart",
            description=translate("prompts.order.tools.viewCart", language),
            input_schema={"type": "object", "properties": {}},
        ),
        ToolSpec(
            name="add_to_cart",
            description=translate("prompts.order.tools.addToCart", language),
            input_schema={
                "type": "object",
                "properties": {
                    "menu_item_id": {
                        "type": "string",
                        "description": translate("prompts.order.tools.addMenuItemId", language),
                    },
                    "quantity": {
                        "type": "integer",
                        "description": translate("prompts.order.tools.addQuantity", language),
                    },
                    "option_ids": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": translate("prompts.order.tools.addOptionIds", language),
                    },
                },
                "required": ["menu_item_id"],
            },
        ),
        ToolSpec(
            name="remove_from_cart",
            description=translate("prompts.order.tools.removeFromCart", language),
            input_schema={
                "type": "object",
                "properties": {"menu_item_id": {"type": "string"}},
                "required": ["menu_item_id"],
            },
        ),
        ToolSpec(
            name="clear_cart",
            description=translate("prompts.order.tools.clearCart", language),
            input_schema={"type": "object", "properties": {}},
        ),
        ToolSpec(
            name="place_order",
            description=translate("prompts.order.tools.placeOrder", language),
            input_schema={
                "type": "object",
                "properties": {
                    "comment": {
                        "type": "string",
                        "description": translate("prompts.order.tools.placeComment", language),
                    },
                    "promo_code": {
                        "type": "string",
                        "description": translate("prompts.order.tools.placePromoCode", language),
                    },
                },
            },
        ),
    ]
