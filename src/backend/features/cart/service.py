import json
import uuid

from fastapi import Depends
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from database import db_helper

from .crud import get_menu_items_by_ids
from .schemas import CartResponse, CartUpdate


class CartService:
    def __init__(self, redis_client: Redis, db_session: AsyncSession):
        self.redis = redis_client
        self.db = db_session
        self.ttl = 86400

    def _get_key(self, user_id: uuid.UUID) -> str:
        return f"cart:{user_id}"

    async def get_cart(self, user_id: uuid.UUID) -> CartResponse:
        raw_data = await self.redis.get(self._get_key(user_id))
        if not raw_data:
            return CartResponse(restaurant_id=None, items=[])

        try:
            cart_dict = json.loads(raw_data)
        except (json.JSONDecodeError, TypeError):
            return CartResponse(restaurant_id=None, items=[])

        items_data = cart_dict.get("items", [])
        if not items_data:
            return CartResponse(restaurant_id=cart_dict.get("restaurant_id"), items=[])

        item_ids = [uuid.UUID(i["menu_item_id"]) for i in items_data]

        menu_items = await get_menu_items_by_ids(self.db, item_ids)
        menu_items_map = {mi.id: mi for mi in menu_items}

        enriched_items = []
        for i in items_data:
            m_id = uuid.UUID(i["menu_item_id"])
            m_item = menu_items_map.get(m_id)
            if m_item:
                enriched_items.append(
                    {
                        "menuItem": {
                            "id": m_item.id,
                            "name": m_item.name,
                            "price": float(m_item.price),
                            "image_url": getattr(m_item, "image_url", None),
                        },
                        "quantity": i["quantity"],
                    }
                )

        return CartResponse(restaurant_id=cart_dict.get("restaurant_id"), items=enriched_items)

    async def update_cart(self, user_id: uuid.UUID, cart_data: CartUpdate):
        await self.redis.set(self._get_key(user_id), cart_data.model_dump_json(), ex=self.ttl)

    async def clear_cart(self, user_id: uuid.UUID):
        await self.redis.delete(self._get_key(user_id))


async def get_cart_service(db: AsyncSession = Depends(db_helper.dependency_session_getter)):
    from settings.config.infra.redis_helper import redis_helper

    client = redis_helper.get_client()
    try:
        yield CartService(client, db)
    finally:
        await client.aclose()
