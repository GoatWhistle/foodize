import uuid
from collections.abc import Iterator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_order_agent.tools import build_order_executor
from infra.llm import ToolExecutor


def make_user() -> MagicMock:
    user = MagicMock()
    user.id = uuid.uuid4()
    return user


def make_cart_item(
    item_id: uuid.UUID | None = None,
    restaurant_id: uuid.UUID | None = None,
    name: str = "Бургер",
    price: int = 250,
    qty: int = 1,
    options: list[Any] | None = None,
) -> MagicMock:
    item = MagicMock()
    item.menuItem = MagicMock()
    item.menuItem.id = item_id or uuid.uuid4()
    item.menuItem.name = name
    item.menuItem.price = price
    item.menuItem.image_url = None
    item.menuItem.photo_url = None
    item.menuItem.restaurant_id = restaurant_id or uuid.uuid4()
    item.quantity = qty
    item.selected_option_ids = []
    item.selected_options = options or []
    return item


def make_cart(items: list[Any] | None = None, restaurant_id: uuid.UUID | None = None) -> MagicMock:
    cart = MagicMock()
    cart.items = items or []
    cart.restaurant_id = restaurant_id
    return cart


class FakeCache:
    def __init__(self) -> None:
        self.store: dict[str, Any] = {}

    async def get(self, key: str) -> Any:
        return self.store.get(key)

    async def set(self, key: str, value: Any, ttl: int | None = None) -> None:
        self.store[key] = value

    async def delete(self, key: str) -> None:
        self.store.pop(key, None)


class OrderExecutorTestBase:
    @pytest.fixture
    def session(self) -> AsyncMock:
        return AsyncMock()

    @pytest.fixture(autouse=True)
    def _mock_session_factory(self, session: AsyncMock) -> Iterator[MagicMock]:
        mock_cm = AsyncMock()
        mock_cm.__aenter__ = AsyncMock(return_value=session)
        mock_cm.__aexit__ = AsyncMock(return_value=False)
        with (
            patch("features.ai_order_agent.tools_cart.db_helper") as mock_db,
            patch("features.ai_order_agent.tools_place.db_helper") as mock_db_place,
        ):
            mock_db.session_factory.return_value = mock_cm
            mock_db_place.session_factory.return_value = mock_cm
            yield mock_db

    @pytest.fixture
    def user(self) -> MagicMock:
        return make_user()

    @pytest.fixture
    def cart_service(self) -> AsyncMock:
        svc = AsyncMock()
        svc.get_cart = AsyncMock(return_value=make_cart())
        svc.clear_cart = AsyncMock()
        svc.update_cart = AsyncMock()
        return svc

    @pytest.fixture
    def cache(self) -> FakeCache:
        return FakeCache()

    @pytest.fixture
    def executor(self, user: MagicMock, cart_service: AsyncMock, cache: FakeCache) -> ToolExecutor:
        return build_order_executor(user, cart_service, cache)  # type: ignore[arg-type]
