from dataclasses import dataclass

from pydantic import JsonValue

from features.ai_order_agent.tool_helpers import cart_summary, order_confirm_key
from features.cart.service import CartService
from features.users.models import User
from infra.cache.base import CacheRepository
from shared.i18n import DEFAULT_LANGUAGE


@dataclass(frozen=True)
class OrderToolContext:
    user: User
    cart_service: CartService
    cache: CacheRepository
    user_turn: int
    language: str = DEFAULT_LANGUAGE

    @property
    def identifier(self) -> str:
        return str(self.user.id)

    @property
    def confirm_key(self) -> str:
        return order_confirm_key(self.identifier)

    async def cart_summary_payload(self) -> dict[str, JsonValue]:
        cart = await self.cart_service.get_cart(self.identifier)
        return cart_summary(cart)

    async def invalidate_confirm(self) -> None:
        await self.cache.delete(self.confirm_key)
