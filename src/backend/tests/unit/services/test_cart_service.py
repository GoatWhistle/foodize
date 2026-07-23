import json
import uuid

import pytest

from features.cart.schemas import CartItemIn, CartUpdate
from features.cart.service import CartService
from tests.fake_cache import FakeCache


class TestCartService:
    @pytest.fixture
    def cache(self) -> FakeCache:
        return FakeCache()

    async def test_get_cart_cache_miss(self, cache: FakeCache) -> None:
        service = CartService(cache=cache)
        user_id = str(uuid.uuid4())

        result = await service.get_cart(user_id)

        assert result.items == []
        assert result.restaurant_id is None

    async def test_get_cart_cache_hit_valid_json(self, cache: FakeCache) -> None:
        user_id = str(uuid.uuid4())
        cart_data = {
            "restaurant_id": str(uuid.uuid4()),
            "items": [
                {
                    "menu_item_id": str(uuid.uuid4()),
                    "name": "Pizza",
                    "price": 1000,
                    "quantity": 2,
                }
            ],
        }
        cache.store[f"cart:{user_id}"] = json.dumps(cart_data)
        service = CartService(cache=cache)

        result = await service.get_cart(user_id)

        assert len(result.items) == 1
        assert result.items[0].quantity == 2

    async def test_get_cart_cache_malformed_json(self, cache: FakeCache) -> None:
        user_id = str(uuid.uuid4())
        cache.store[f"cart:{user_id}"] = "not valid json {"
        service = CartService(cache=cache)

        result = await service.get_cart(user_id)

        assert result.items == []
        assert result.restaurant_id is None

    async def test_get_cart_cache_empty_string(self, cache: FakeCache) -> None:
        user_id = str(uuid.uuid4())
        cache.store[f"cart:{user_id}"] = ""
        service = CartService(cache=cache)

        result = await service.get_cart(user_id)

        assert result.items == []
        assert result.restaurant_id is None

    async def test_update_cart(self, cache: FakeCache) -> None:
        service = CartService(cache=cache)
        user_id = str(uuid.uuid4())
        cart_update = CartUpdate(
            restaurant_id=uuid.uuid4(),
            items=[CartItemIn(menu_item_id=uuid.uuid4(), name="Burger", price=200, quantity=1)],
        )

        await service.update_cart(user_id, cart_update)

        assert f"cart:{user_id}" in cache.store

    async def test_clear_cart(self, cache: FakeCache) -> None:
        service = CartService(cache=cache)
        user_id = str(uuid.uuid4())
        cache.store[f"cart:{user_id}"] = "{}"

        await service.clear_cart(user_id)

        assert f"cart:{user_id}" not in cache.store
