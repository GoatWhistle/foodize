import uuid
from collections.abc import Iterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_order_agent.tools import build_order_executor
from features.cart.schemas import (
    CartItemResponse,
    CartResponse,
    CartSelectedOption,
    MenuItemShort,
)
from features.users.models import User
from infra.llm import ToolExecutor
from tests.fake_cache import FakeCache
from tests.fake_cart_service import FakeCartService


def make_user() -> User:
    return User(id=uuid.uuid4())


def make_cart_item(
    item_id: uuid.UUID | None = None,
    name: str = "Бургер",
    price: int = 250,
    qty: int = 1,
    options: list[CartSelectedOption] | None = None,
) -> CartItemResponse:
    return CartItemResponse(
        menu_item=MenuItemShort(id=item_id or uuid.uuid4(), name=name, price=price),
        quantity=qty,
        selected_option_ids=[],
        selected_options=options or [],
    )


def make_cart(
    items: list[CartItemResponse] | None = None, restaurant_id: uuid.UUID | None = None
) -> CartResponse:
    return CartResponse(restaurant_id=restaurant_id, items=items or [])


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
    def user(self) -> User:
        return make_user()

    @pytest.fixture
    def cart_service(self) -> FakeCartService:
        return FakeCartService()

    @pytest.fixture
    def cache(self) -> FakeCache:
        return FakeCache()

    @pytest.fixture
    def executor(self, user: User, cart_service: FakeCartService, cache: FakeCache) -> ToolExecutor:
        return build_order_executor(user, cart_service, cache)
