import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.notifications.consumer import _process_message, _retry_count
from features.notifications.events import (
    OrderPlacedEvent,
    OrderStatusChangedEvent,
)
from shared.enums.order_status import OrderStatus


def _make_message(body: bytes) -> MagicMock:
    message = MagicMock()
    message.body = body
    message.headers = {}
    message.content_type = "application/json"
    message.nack = AsyncMock()
    message.ack = AsyncMock()
    message.process = MagicMock(
        return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock())
    )
    return message


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


class TestConsumer:
    @pytest.mark.asyncio
    async def test_process_message_publishes_notification_on_success(self) -> None:
        event = _make_placed_event()
        message = _make_message(event.model_dump_json().encode())

        publish = AsyncMock()
        with (
            patch(
                "features.notifications.consumer._handle_event",
                new_callable=AsyncMock,
                return_value=(event.user_id, "{}"),
            ),
            patch("features.notifications.consumer._publish_user_notification", publish),
        ):
            await _process_message(message, "order.placed")
        publish.assert_awaited_once_with(event.user_id, "{}")

    @pytest.mark.asyncio
    async def test_process_message_skips_duplicate_event(self) -> None:
        event = _make_placed_event()
        message = _make_message(event.model_dump_json().encode())

        publish = AsyncMock()
        with (
            patch(
                "features.notifications.consumer._handle_event",
                new_callable=AsyncMock,
                return_value=None,
            ),
            patch("features.notifications.consumer._publish_user_notification", publish),
        ):
            await _process_message(message, "order.placed")
        publish.assert_not_awaited()
        message.nack.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_process_message_rejects_oversized_body(self) -> None:
        message = _make_message(b"x" * (64 * 1024 + 1))
        await _process_message(message, "order.placed")
        message.nack.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_process_message_unknown_routing_key_no_crash(self) -> None:
        message = _make_message(b"{}")
        await _process_message(message, "unknown.routing.key")
        message.nack.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_process_message_handler_error_goes_to_retry(self) -> None:
        event = _make_placed_event()
        message = _make_message(event.model_dump_json().encode())

        send_retry = AsyncMock()
        with (
            patch(
                "features.notifications.consumer._handle_event",
                new_callable=AsyncMock,
                side_effect=RuntimeError("fail"),
            ),
            patch("features.notifications.consumer._send_to_retry", send_retry),
        ):
            await _process_message(message, "order.placed")
        send_retry.assert_awaited_once()
        message.ack.assert_awaited_once()
        message.nack.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_process_message_dead_letters_after_max_retries(self) -> None:
        event = _make_placed_event()
        message = _make_message(event.model_dump_json().encode())
        message.headers = {"x-retry-count": 5}

        send_retry = AsyncMock()
        with (
            patch(
                "features.notifications.consumer._handle_event",
                new_callable=AsyncMock,
                side_effect=RuntimeError("fail"),
            ),
            patch("features.notifications.consumer._send_to_retry", send_retry),
        ):
            await _process_message(message, "order.placed")
        send_retry.assert_not_awaited()
        message.nack.assert_awaited_once_with(requeue=False)

    def test_retry_count_parses_header(self) -> None:
        message = MagicMock()
        message.headers = {"x-retry-count": 3}
        assert _retry_count(message) == 3

    def test_retry_count_defaults_to_zero(self) -> None:
        message = MagicMock()
        message.headers = None
        assert _retry_count(message) == 0
