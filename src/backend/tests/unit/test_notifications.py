import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.notifications.events import OrderPlacedEvent, OrderStatusChangedEvent
from features.notifications.handlers import handle_order_placed, handle_order_status_changed
from shared.enums.order_status import OrderStatus


def _make_placed_event() -> OrderPlacedEvent:
    return OrderPlacedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        total_price=1500,
        items_count=3,
    )


def _make_status_event() -> OrderStatusChangedEvent:
    return OrderStatusChangedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        old_status=OrderStatus.PENDING,
        new_status=OrderStatus.ACCEPTED,
        total_price=1500,
    )


class TestHandlers:
    @pytest.mark.asyncio
    async def test_handle_order_placed_logs(self, caplog):
        import logging

        event = _make_placed_event()
        with caplog.at_level(logging.INFO, logger="features.notifications.handlers"):
            await handle_order_placed(event)
        assert "order.placed" in caplog.text

    @pytest.mark.asyncio
    async def test_handle_order_status_changed_logs(self, caplog):
        import logging

        event = _make_status_event()
        with caplog.at_level(logging.INFO, logger="features.notifications.handlers"):
            await handle_order_status_changed(event)
        assert "order.status_changed" in caplog.text


class TestPublisher:
    @pytest.mark.asyncio
    async def test_publish_order_placed_calls_publish(self):
        from features.notifications.publisher import publish_order_placed

        event = _make_placed_event()
        mock_publisher = AsyncMock()

        with patch(
            "features.notifications.publisher.get_rabbitmq_publisher", return_value=mock_publisher
        ):
            await publish_order_placed(event)

        mock_publisher.publish.assert_awaited_once()
        call_args = mock_publisher.publish.call_args
        assert call_args[0][0] == "order.placed"

    @pytest.mark.asyncio
    async def test_publish_order_status_changed_calls_publish(self):
        from features.notifications.publisher import publish_order_status_changed

        event = _make_status_event()
        mock_publisher = AsyncMock()

        with patch(
            "features.notifications.publisher.get_rabbitmq_publisher", return_value=mock_publisher
        ):
            await publish_order_status_changed(event)

        mock_publisher.publish.assert_awaited_once()
        call_args = mock_publisher.publish.call_args
        assert call_args[0][0] == "order.status_changed"


class TestConsumer:
    @pytest.mark.asyncio
    async def test_process_message_valid_order_placed(self, caplog):
        import logging

        from features.notifications.consumer import _process_message

        event = _make_placed_event()
        message = MagicMock()
        message.body = event.model_dump_json().encode()
        message.process = MagicMock(
            return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock())
        )

        with caplog.at_level(logging.INFO, logger="features.notifications.handlers"):
            await _process_message(message, "order.placed")
        assert "order.placed" in caplog.text

    @pytest.mark.asyncio
    async def test_process_message_valid_order_status_changed(self, caplog):
        import logging

        from features.notifications.consumer import _process_message

        event = _make_status_event()
        message = MagicMock()
        message.body = event.model_dump_json().encode()
        message.process = MagicMock(
            return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock())
        )

        with caplog.at_level(logging.INFO, logger="features.notifications.handlers"):
            await _process_message(message, "order.status_changed")
        assert "order.status_changed" in caplog.text

    @pytest.mark.asyncio
    async def test_process_message_unknown_routing_key_no_crash(self):
        from features.notifications.consumer import _process_message

        message = MagicMock()
        message.body = b"{}"
        message.process = MagicMock(
            return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock())
        )

        await _process_message(message, "unknown.routing.key")

    @pytest.mark.asyncio
    async def test_process_message_handler_raises_no_crash(self):
        from features.notifications.consumer import _process_message

        event = _make_placed_event()
        message = MagicMock()
        message.body = event.model_dump_json().encode()
        message.process = MagicMock(
            return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock())
        )

        with patch(
            "features.notifications.consumer.handle_order_placed",
            new_callable=AsyncMock,
            side_effect=RuntimeError("fail"),
        ):
            await _process_message(message, "order.placed")
