import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.ai_order_agent.tools import build_order_executor
from infra.llm import ToolCall, ToolExecutor

from .ai_order_tools_helpers import FakeCache, OrderExecutorTestBase, make_cart, make_cart_item


class TestPlaceOrderTool(OrderExecutorTestBase):
    async def test_place_order_without_view_cart_is_rejected(
        self, executor: ToolExecutor, cart_service: AsyncMock
    ) -> None:
        rid = uuid.uuid4()
        cart_item = make_cart_item(restaurant_id=rid)
        cart_service.get_cart.return_value = make_cart(items=[cart_item], restaurant_id=rid)
        call = ToolCall(id="t1", name="place_order", arguments={})
        result = json.loads(await executor(call))
        assert result["error"] == "cart_not_confirmed"

    async def test_place_order_empty_cart(
        self, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        cart_service.get_cart.return_value = make_cart(items=[])
        view = build_order_executor(user, cart_service, cache, user_turn=1)  # type: ignore[arg-type]
        place = build_order_executor(user, cart_service, cache, user_turn=2)  # type: ignore[arg-type]
        await view(ToolCall(id="t0", name="view_cart", arguments={}))
        call = ToolCall(id="t1", name="place_order", arguments={})
        result = json.loads(await place(call))
        assert result["error"] == "cart_empty"

    async def test_place_order_success(
        self, session: AsyncMock, user: MagicMock, cart_service: AsyncMock, cache: FakeCache
    ) -> None:
        rid = uuid.uuid4()
        item_id = uuid.uuid4()
        cart_item = make_cart_item(item_id=item_id, restaurant_id=rid)
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
