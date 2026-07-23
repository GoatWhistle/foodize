import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from features.ai_order_agent.tools import build_order_executor
from features.menu.models import MenuItem
from features.users.models import User
from infra.llm import ToolCall, ToolExecutor
from tests.fake_cache import FakeCache
from tests.fake_cart_service import FakeCartService

from .ai_order_tools_helpers import (
    OrderExecutorTestBase,
    make_cart,
    make_cart_item,
)


class TestCartTools(OrderExecutorTestBase):
    async def test_unknown_tool(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="nonexistent", arguments={})
        result = json.loads(await executor(call))
        assert "error" in result
        assert "Unknown tool" in result["error"]

    async def test_view_cart_empty(
        self, executor: ToolExecutor, cart_service: FakeCartService
    ) -> None:
        cart_service.cart = make_cart()
        call = ToolCall(id="t1", name="view_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["items"] == []
        assert result["total"] == 0

    async def test_view_cart_with_items(
        self, executor: ToolExecutor, cart_service: FakeCartService
    ) -> None:
        rid = uuid.uuid4()
        item = make_cart_item(price=300, qty=2)
        cart_service.cart = make_cart(items=[item], restaurant_id=rid)
        call = ToolCall(id="t1", name="view_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["total"] == 600
        assert len(result["items"]) == 1

    @pytest.mark.usefixtures("session")
    async def test_search_menu(
        self, user: User, cart_service: FakeCartService, cache: FakeCache
    ) -> None:
        results = [{"id": str(uuid.uuid4()), "name": "Шаурма", "category": "snacks", "price": 150}]
        executor = build_order_executor(user, cart_service, cache)
        with patch(
            "features.ai_order_agent.tools_cart.search_mod.semantic_search",
            new_callable=AsyncMock,
            return_value=results,
        ):
            call = ToolCall(id="t1", name="search_menu", arguments={"query": "шаурма"})
            result = json.loads(await executor(call))
        assert "results" in result
        assert result["results"][0]["name"] == "<<<ITEM>>>Шаурма<<<END_ITEM>>>"

    @pytest.mark.usefixtures("session")
    async def test_search_menu_empty_results(
        self, user: User, cart_service: FakeCartService, cache: FakeCache
    ) -> None:
        executor = build_order_executor(user, cart_service, cache)
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

    @pytest.mark.usefixtures("session")
    async def test_add_to_cart_unavailable_item(
        self, user: User, cart_service: FakeCartService, cache: FakeCache
    ) -> None:
        item_id = uuid.uuid4()
        menu_item = MenuItem(id=item_id, is_deleted=True, is_available=False)
        executor = build_order_executor(user, cart_service, cache)
        with patch(
            "features.ai_order_agent.tools_cart.get_menu_item_by_id",
            new_callable=AsyncMock,
            return_value=menu_item,
        ):
            call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": str(item_id)})
            result = json.loads(await executor(call))
        assert result["error"] == "item_unavailable"

    @pytest.mark.usefixtures("session")
    async def test_add_to_cart_none_item(
        self, user: User, cart_service: FakeCartService, cache: FakeCache
    ) -> None:
        item_id = uuid.uuid4()
        executor = build_order_executor(user, cart_service, cache)
        with patch(
            "features.ai_order_agent.tools_cart.get_menu_item_by_id",
            new_callable=AsyncMock,
            return_value=None,
        ):
            call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": str(item_id)})
            result = json.loads(await executor(call))
        assert result["error"] == "item_unavailable"

    @pytest.mark.usefixtures("session")
    async def test_add_to_cart_different_restaurant(
        self, user: User, cart_service: FakeCartService, cache: FakeCache
    ) -> None:
        item_id = uuid.uuid4()
        existing_rid = uuid.uuid4()
        new_rid = uuid.uuid4()

        menu_item = MenuItem(
            id=item_id,
            is_deleted=False,
            is_available=True,
            restaurant_id=new_rid,
            option_groups=[],
        )

        cart_item = make_cart_item()
        cart_service.cart = make_cart(items=[cart_item], restaurant_id=existing_rid)
        executor = build_order_executor(user, cart_service, cache)
        with patch(
            "features.ai_order_agent.tools_cart.get_menu_item_by_id",
            new_callable=AsyncMock,
            return_value=menu_item,
        ):
            call = ToolCall(id="t1", name="add_to_cart", arguments={"menu_item_id": str(item_id)})
            result = json.loads(await executor(call))
        assert result["error"] == "cart_has_other_restaurant"

    async def test_clear_cart(self, executor: ToolExecutor, cart_service: FakeCartService) -> None:
        call = ToolCall(id="t1", name="clear_cart", arguments={})
        result = json.loads(await executor(call))
        assert result["ok"] is True
        assert len(cart_service.cleared) == 1

    async def test_remove_from_cart_invalid_id(self, executor: ToolExecutor) -> None:
        call = ToolCall(id="t1", name="remove_from_cart", arguments={"menu_item_id": "bad"})
        result = json.loads(await executor(call))
        assert result["error"] == "invalid_menu_item_id"

    async def test_remove_from_cart_empties_cart(
        self, executor: ToolExecutor, cart_service: FakeCartService
    ) -> None:
        item_id = uuid.uuid4()
        cart_item = make_cart_item(item_id=item_id)
        rid = uuid.uuid4()
        cart_service.cart = make_cart(items=[cart_item], restaurant_id=rid)

        call = ToolCall(id="t1", name="remove_from_cart", arguments={"menu_item_id": str(item_id)})
        result = json.loads(await executor(call))
        assert result["ok"] is True
        assert cart_service.cleared
