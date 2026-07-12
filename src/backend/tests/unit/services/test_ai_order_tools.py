import json
import uuid
from collections.abc import Iterator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_order_agent.tool_helpers import _dumps, _parse_uuid
from features.ai_order_agent.tools import build_order_executor
from infra.llm import ToolCall, ToolExecutor


class TestDumps:
    def test_cyrillic_preserved(self) -> None:
        result = _dumps({"msg": "привет"})
        assert "привет" in result

    def test_returns_json_string(self) -> None:
        result = _dumps({"a": 1})
        data = json.loads(result)
        assert data["a"] == 1


class TestParseUuid:
    def test_valid(self) -> None:
        rid = uuid.uuid4()
        assert _parse_uuid(str(rid)) == rid

    def test_none(self) -> None:
        assert _parse_uuid(None) is None

    def test_empty_string(self) -> None:
        assert _parse_uuid("") is None

    def test_invalid(self) -> None:
        assert _parse_uuid("not-a-uuid") is None


def _make_user() -> MagicMock:
    user = MagicMock()
    user.id = uuid.uuid4()
    return user


def _make_cart_item(
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


def _make_cart(items: list[Any] | None = None, restaurant_id: uuid.UUID | None = None) -> MagicMock:
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


class TestBuildOrderExecutor:
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
        return _make_user()

    @pytest.fixture
    def cart_service(self) -> AsyncMock:
        svc = AsyncMock()
        svc.get_cart = AsyncMock(return_value=_make_cart())
        svc.clear_cart = AsyncMock()
        svc.update_cart = AsyncMock()
        return svc

    @pytest.fixture
    def cache(self) -> FakeCache:
        return FakeCache()

    @pytest.fixture
    def executor(self, user: MagicMock, cart_service: AsyncMock, cache: FakeCache) -> ToolExecutor:
        return build_order_executor(user, cart_service, cache)  # type: ignore[arg-type]

    @pytest.mark.asyncio
    async def test_unknown_tool(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="nonexistent", arguments={})
        result = json.loads(await executor(call))
        assert "error" in result
        assert "Unknown tool" in result["error"]

    @pytest.mark.asyncio
    async def test_view_cart_empty(self, executor: ToolExecutor, cart_service: AsyncMock) -> None:
        cart_service.get_cart.return_value = _make_cart()
        call = ToolCall(id="t1", name="view_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["items"] == []
        assert result["total"] == 0

    @pytest.mark.asyncio
    async def test_view_cart_with_items(
        self, executor: ToolExecutor, cart_service: AsyncMock
    ) -> None:
        rid = uuid.uuid4()
        item = _make_cart_item(restaurant_id=rid, price=300, qty=2)
        cart_service.get_cart.return_value = _make_cart(items=[item], restaurant_id=rid)
        call = ToolCall(id="t1", name="view_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["total"] == 600
        assert len(result["items"]) == 1

    @pytest.mark.asyncio
    async def test_search_menu(
        self, session: AsyncMock, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        results = [{"id": str(uuid.uuid4()), "name": "Шаурма", "category": "snacks", "price": 150}]
        executor = build_order_executor(user, cart_service, cache)  # type: ignore[arg-type]
        with patch(
            "features.ai_order_agent.tools_cart.search_mod.semantic_search",
            new_callable=AsyncMock,
            return_value=results,
        ):
            call = ToolCall(id="t1", name="search_menu", arguments={"query": "шаурма"})
            result = json.loads(await executor(call))
        assert "results" in result
        assert result["results"][0]["name"] == "<<<ITEM>>>Шаурма<<<END_ITEM>>>"

    @pytest.mark.asyncio
    async def test_search_menu_empty_results(
        self, session: AsyncMock, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        executor = build_order_executor(user, cart_service, cache)  # type: ignore[arg-type]
        with patch(
            "features.ai_order_agent.tools_cart.search_mod.semantic_search",
            new_callable=AsyncMock,
            return_value=[],
        ):
            call = ToolCall(id="t1", name="search_menu", arguments={"query": "ничего"})
            result = json.loads(await executor(call))
        assert result["results"] == []
        assert "message" in result

    @pytest.mark.asyncio
    async def test_add_to_cart_invalid_id(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": "bad"})
        result = json.loads(await executor(call))
        assert result["error"] == "invalid_menu_item_id"

    @pytest.mark.asyncio
    async def test_add_to_cart_unavailable_item(
        self, session: AsyncMock, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        item_id = uuid.uuid4()
        menu_item = MagicMock()
        menu_item.is_deleted = True
        menu_item.is_available = False
        executor = build_order_executor(user, cart_service, cache)  # type: ignore[arg-type]
        with patch(
            "features.ai_order_agent.tools_cart.get_menu_item_by_id",
            new_callable=AsyncMock,
            return_value=menu_item,
        ):
            call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": str(item_id)})
            result = json.loads(await executor(call))
        assert result["error"] == "item_unavailable"

    @pytest.mark.asyncio
    async def test_add_to_cart_none_item(
        self, session: AsyncMock, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        item_id = uuid.uuid4()
        executor = build_order_executor(user, cart_service, cache)  # type: ignore[arg-type]
        with patch(
            "features.ai_order_agent.tools_cart.get_menu_item_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": str(item_id)})
            result = json.loads(await executor(call))
        assert result["error"] == "item_unavailable"

    @pytest.mark.asyncio
    async def test_add_to_cart_different_restaurant(
        self, session: AsyncMock, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        item_id = uuid.uuid4()
        existing_rid = uuid.uuid4()
        new_rid = uuid.uuid4()

        menu_item = MagicMock()
        menu_item.is_deleted = False
        menu_item.is_available = True
        menu_item.id = item_id
        menu_item.restaurant_id = new_rid
        menu_item.option_groups = []

        cart_item = _make_cart_item(restaurant_id=existing_rid)
        cart_service.get_cart.return_value = _make_cart(
            items=[cart_item], restaurant_id=existing_rid
        )
        executor = build_order_executor(user, cart_service, cache)  # type: ignore[arg-type]
        with patch(
            "features.ai_order_agent.tools_cart.get_menu_item_by_id",
            new_callable=AsyncMock,
            return_value=menu_item,
        ):
            call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": str(item_id)})
            result = json.loads(await executor(call))
        assert result["error"] == "cart_has_other_restaurant"

    @pytest.mark.asyncio
    async def test_clear_cart(self, executor: ToolExecutor, cart_service: AsyncMock) -> None:
        call = ToolCall(id="t1", name="clear_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["ok"] is True
        cart_service.clear_cart.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_remove_from_cart_invalid_id(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="remove_from_cart", arguments={"menu_item_id": "bad"})
        result = json.loads(await executor(call))
        assert result["error"] == "invalid_menu_item_id"

    @pytest.mark.asyncio
    async def test_remove_from_cart_empties_cart(
        self, executor: ToolExecutor, cart_service: AsyncMock
    ) -> None:
        item_id = uuid.uuid4()
        cart_item = _make_cart_item(item_id=item_id)
        rid = uuid.uuid4()
        cart_service.get_cart.return_value = _make_cart(items=[cart_item], restaurant_id=rid)

        call = ToolCall(id="t1", name="remove_from_cart", arguments={"menu_item_id": str(item_id)})
        result = json.loads(await executor(call))
        assert result["ok"] is True
        cart_service.clear_cart.assert_awaited()

    @pytest.mark.asyncio
    async def test_place_order_without_view_cart_is_rejected(
        self, executor: ToolExecutor, cart_service: AsyncMock
    ) -> None:
        rid = uuid.uuid4()
        cart_item = _make_cart_item(restaurant_id=rid)
        cart_service.get_cart.return_value = _make_cart(items=[cart_item], restaurant_id=rid)
        call = ToolCall(id="t1", name="place_order", arguments={})
        result = json.loads(await executor(call))
        assert result["error"] == "cart_not_confirmed"

    @pytest.mark.asyncio
    async def test_place_order_empty_cart(
        self, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        cart_service.get_cart.return_value = _make_cart(items=[])
        view = build_order_executor(user, cart_service, cache, user_turn=1)  # type: ignore[arg-type]
        place = build_order_executor(user, cart_service, cache, user_turn=2)  # type: ignore[arg-type]
        await view(ToolCall(id="t0", name="view_cart", arguments={}))
        call = ToolCall(id="t1", name="place_order", arguments={})
        result = json.loads(await place(call))
        assert result["error"] == "cart_empty"

    @pytest.mark.asyncio
    async def test_place_order_success(
        self, session: AsyncMock, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        rid = uuid.uuid4()
        item_id = uuid.uuid4()
        cart_item = _make_cart_item(item_id=item_id, restaurant_id=rid)
        cart_item.menuItem.id = item_id
        cart_item.menuItem.name = "Бургер"
        cart_item.menuItem.price = 250
        cart_item.quantity = 1
        cart_item.selected_option_ids = []

        mock_cart = MagicMock()
        mock_cart.items = [cart_item]
        mock_cart.restaurant_id = rid
        cart_service.get_cart.return_value = mock_cart

        order_result = MagicMock()
        order_result.model_dump.return_value = {
            "display_id": "ORD-001",
            "status": "pending",
            "total_price": 250,
        }

        view = build_order_executor(user, cart_service, cache, user_turn=1)  # type: ignore[arg-type]
        place = build_order_executor(user, cart_service, cache, user_turn=2)  # type: ignore[arg-type]
        await view(ToolCall(id="t0", name="view_cart", arguments={}))
        with patch(
            "features.ai_order_agent.tools_place.place_order",
            new_callable=AsyncMock,
            return_value=order_result,
        ):
            call = ToolCall(id="t1", name="place_order", arguments={})
            result = json.loads(await place(call))

        assert result["ok"] is True
        assert result["order"]["number"] == "ORD-001"
        cart_service.clear_cart.assert_awaited()
