import json
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_order_agent.tools import build_order_executor
from features.users.models import User
from infra.llm import ToolCall, ToolExecutor
from tests.fake_cache import FakeCache
from tests.fake_cart_service import FakeCartService

from .ai_order_tools_helpers import (
    OrderExecutorTestBase,
    make_cart,
    make_cart_item,
)


class TestPlaceOrderTool(OrderExecutorTestBase):
    async def test_place_order_without_view_cart_is_rejected(
        self, executor: ToolExecutor, cart_service: FakeCartService
    ) -> None:
        rid = uuid.uuid4()
        cart_item = make_cart_item()
        cart_service.cart = make_cart(items=[cart_item], restaurant_id=rid)
        call = ToolCall(id="t1", name="place_order", arguments={})
        result = json.loads(await executor(call))
        assert result["error"] == "cart_not_confirmed"

    async def test_place_order_empty_cart(
        self, user: User, cart_service: FakeCartService, cache: FakeCache
    ) -> None:
        cart_service.cart = make_cart(items=[])
        view = build_order_executor(user, cart_service, cache, user_turn=1)
        place = build_order_executor(user, cart_service, cache, user_turn=2)
        await view(ToolCall(id="t0", name="view_cart", arguments={}))
        call = ToolCall(id="t1", name="place_order", arguments={})
        result = json.loads(await place(call))
        assert result["error"] == "cart_empty"

    @pytest.mark.usefixtures("session")
    async def test_place_order_success(
        self, user: User, cart_service: FakeCartService, cache: FakeCache
    ) -> None:
        rid = uuid.uuid4()
        item_id = uuid.uuid4()
        cart_item = make_cart_item(item_id=item_id, name="Бургер", price=250)
        cart_service.cart = make_cart(items=[cart_item], restaurant_id=rid)

        order_result = MagicMock()
        order_result.model_dump.return_value = {
            "display_id": "ORD-001",
            "status": "pending",
            "total_price": 250,
        }

        view = build_order_executor(user, cart_service, cache, user_turn=1)
        place = build_order_executor(user, cart_service, cache, user_turn=2)
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
        assert cart_service.cleared
