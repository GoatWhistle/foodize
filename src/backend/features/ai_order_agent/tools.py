from collections.abc import Awaitable, Callable
from typing import Any

from features.ai_order_agent.tool_context import OrderToolContext
from features.ai_order_agent.tool_helpers import _dumps
from features.ai_order_agent.tool_specs import ORDER_TOOLS
from features.ai_order_agent.tools_cart import (
    add_to_cart,
    clear_cart,
    remove_from_cart,
    search_menu,
    view_cart,
)
from features.ai_order_agent.tools_place import place_order_tool
from features.cart.service import CartService
from features.users.models import User
from infra.cache.base import CacheRepository
from infra.llm import ToolCall, ToolExecutor

__all__ = ["ORDER_TOOLS", "build_order_executor"]

_ToolHandler = Callable[[OrderToolContext, dict[str, Any]], Awaitable[str]]

_HANDLERS: dict[str, _ToolHandler] = {
    "search_menu": search_menu,
    "view_cart": view_cart,
    "add_to_cart": add_to_cart,
    "remove_from_cart": remove_from_cart,
    "clear_cart": clear_cart,
    "place_order": place_order_tool,
}


def build_order_executor(
    user: User,
    cart_service: CartService,
    cache: CacheRepository,
    *,
    user_turn: int = 0,
) -> ToolExecutor:
    context = OrderToolContext(
        user=user, cart_service=cart_service, cache=cache, user_turn=user_turn
    )

    async def execute(call: ToolCall) -> str:
        handler = _HANDLERS.get(call.name)
        if handler is None:
            return _dumps({"error": f"Unknown tool: {call.name}"})
        return await handler(context, call.arguments or {})

    return execute
