import json
import uuid

from fastapi import Depends

from infra.cache.base import CacheRepository
from infra.cache.redis import get_redis_cache

from .schemas import CartResponse, CartUpdate

_CART_TTL_SECONDS = 86400


class CartService:
    def __init__(self, cache: CacheRepository) -> None:
        self._cache = cache
        self._ttl = _CART_TTL_SECONDS

    def _key(self, user_id: uuid.UUID) -> str:
        return f"cart:{user_id}"

    async def get_cart(self, user_id: uuid.UUID) -> CartResponse:
        raw = await self._cache.get(self._key(user_id))
        if not raw:
            return CartResponse(restaurant_id=None, items=[])

        try:
            cart_dict = json.loads(raw)
        except (json.JSONDecodeError, TypeError):
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
            }
            for i in cart_dict.get("items", [])
        ]
        return CartResponse(restaurant_id=cart_dict.get("restaurant_id"), items=enriched)

    async def update_cart(self, user_id: uuid.UUID, cart_data: CartUpdate) -> None:
        await self._cache.set(self._key(user_id), cart_data.model_dump_json(), ttl=self._ttl)

    async def clear_cart(self, user_id: uuid.UUID) -> None:
        await self._cache.delete(self._key(user_id))


def get_cart_service(cache: CacheRepository = Depends(get_redis_cache)) -> CartService:
    return CartService(cache)
