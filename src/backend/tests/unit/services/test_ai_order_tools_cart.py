import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.ai_order_agent.tools import build_order_executor
from infra.llm import ToolCall, ToolExecutor

from .ai_order_tools_helpers import FakeCache, OrderExecutorTestBase, make_cart, make_cart_item


class TestCartTools(OrderExecutorTestBase):
    async def test_unknown_tool(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="nonexistent", arguments={})
        result = json.loads(await executor(call))
        assert "error" in result
        assert "Unknown tool" in result["error"]

    async def test_view_cart_empty(self, executor: ToolExecutor, cart_service: AsyncMock) -> None:
        cart_service.get_cart.return_value = make_cart()
        call = ToolCall(id="t1", name="view_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["items"] == []
        assert result["total"] == 0

    async def test_view_cart_with_items(
        self, executor: ToolExecutor, cart_service: AsyncMock
    ) -> None:
        rid = uuid.uuid4()
        item = make_cart_item(restaurant_id=rid, price=300, qty=2)
        cart_service.get_cart.return_value = make_cart(items=[item], restaurant_id=rid)
        call = ToolCall(id="t1", name="view_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["total"] == 600
        assert len(result["items"]) == 1

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

    async def test_add_to_cart_invalid_id(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": "bad"})
        result = json.loads(await executor(call))
        assert result["error"] == "invalid_menu_item_id"

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

        cart_item = make_cart_item(restaurant_id=existing_rid)
        cart_service.get_cart.return_value = make_cart(
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

    async def test_clear_cart(self, executor: ToolExecutor, cart_service: AsyncMock) -> None:
        call = ToolCall(id="t1", name="clear_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["ok"] is True
        cart_service.clear_cart.assert_awaited_once()

    async def test_remove_from_cart_invalid_id(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="remove_from_cart", arguments={"menu_item_id": "bad"})
        result = json.loads(await executor(call))
        assert result["error"] == "invalid_menu_item_id"

    async def test_remove_from_cart_empties_cart(
        self, executor: ToolExecutor, cart_service: AsyncMock
    ) -> None:
        item_id = uuid.uuid4()
        cart_item = make_cart_item(item_id=item_id)
        rid = uuid.uuid4()
        cart_service.get_cart.return_value = make_cart(items=[cart_item], restaurant_id=rid)

        call = ToolCall(id="t1", name="remove_from_cart", arguments={"menu_item_id": str(item_id)})
        result = json.loads(await executor(call))
        assert result["ok"] is True
        cart_service.clear_cart.assert_awaited()
