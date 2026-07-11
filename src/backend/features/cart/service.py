import json
import logging

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from features.menu.crud import get_menu_items_by_ids_simple
from infra.cache.base import CacheRepository
from infra.cache.redis import get_redis_cache

from .schemas import CartItemIn, CartResponse, CartSelectedOption, CartUpdate

logger = logging.getLogger(__name__)

_CART_TTL_SECONDS = 86400


class CartService:
    def __init__(self, cache: CacheRepository) -> None:
        self._cache = cache
        self._ttl = _CART_TTL_SECONDS

    def _key(self, identifier: str) -> str:
        return f"cart:{identifier}"

    async def get_cart(self, identifier: str) -> CartResponse:
        raw = await self._cache.get(self._key(identifier))
        if not raw:
            return CartResponse(restaurant_id=None, items=[])

        try:
            cart_dict = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
            logger.error("Corrupted cart data for key=%s", self._key(identifier))
            return CartResponse(restaurant_id=None, items=[])

        enriched = [
            {
                "menuItem": {
                    "id": i["menu_item_id"],
                    "name": i["name"],
                    "price": i["price"],
                    "image_url": i.get("image_url"),
                },
                "quantity": i["quantity"],
                "selected_option_ids": i.get("selected_option_ids", []),
                "selected_options": i.get("selected_options", []),
            }
            for i in cart_dict.get("items", [])
        ]
        return CartResponse(
            restaurant_id=cart_dict.get("restaurant_id"),
            items=enriched,  # type: ignore[arg-type]
        )

    async def update_cart(
        self,
        identifier: str,
        cart_data: CartUpdate,
        session: AsyncSession | None = None,
    ) -> None:
        if session is not None:
            item_ids = [item.menu_item_id for item in cart_data.items]
            db_items = await get_menu_items_by_ids_simple(session, item_ids)
            sanitized: list[CartItemIn] = []
            for item in cart_data.items:
                db_item = db_items.get(item.menu_item_id)
                if db_item is None:
                    continue
                available_options = {
                    o.id: o for g in db_item.option_groups for o in g.options if o.is_available
                }
                valid_options = [
                    CartSelectedOption(
                        option_id=o.option_id,
                        name=available_options[o.option_id].name,
                        price_delta=available_options[o.option_id].price_delta,
                    )
                    for o in item.selected_options
                    if o.option_id in available_options
                ]
                valid_ids = [o.option_id for o in valid_options]
                sanitized.append(
                    CartItemIn(
                        menu_item_id=db_item.id,
                        name=db_item.name,
                        price=db_item.price,
                        image_url=db_item.photo_url,
                        quantity=item.quantity,
                        selected_option_ids=valid_ids,
                        selected_options=valid_options,
                    )
                )
            cart_data = CartUpdate(restaurant_id=cart_data.restaurant_id, items=sanitized)
        await self._cache.set(self._key(identifier), cart_data.model_dump_json(), ttl=self._ttl)

    async def clear_cart(self, identifier: str) -> None:
        await self._cache.delete(self._key(identifier))


def get_cart_service(cache: CacheRepository = Depends(get_redis_cache)) -> CartService:
    return CartService(cache)
