import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.notifications.consumer import (
    _BINDINGS_BY_ROUTING_KEY,
    _handle_event,
    _parse_message_event,
    _process_message,
    _retry_count,
    _send_to_retry,
)
from features.notifications.events import (
    OrderPlacedEvent,
    OrderStatusChangedEvent,
    UserNotificationMessage,
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
    async def test_process_message_publishes_notification_on_success(self) -> None:
        event = _make_placed_event()
        message = _make_message(event.model_dump_json().encode())

        publish = AsyncMock()
        staged = UserNotificationMessage(user_id=event.user_id, payload="{}")
        with (
            patch(
                "features.notifications.consumer._handle_event",
                new_callable=AsyncMock,
                return_value=staged,
            ),
            patch("features.notifications.consumer._publish_user_notification", publish),
        ):
            await _process_message(message, "order.placed")
        publish.assert_awaited_once_with(staged)

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

    async def test_process_message_rejects_oversized_body(self) -> None:
        message = _make_message(b"x" * (64 * 1024 + 1))
        await _process_message(message, "order.placed")
        message.nack.assert_awaited_once()

    async def test_process_message_unknown_routing_key_no_crash(self) -> None:
        message = _make_message(b"{}")
        await _process_message(message, "unknown.routing.key")
        message.nack.assert_awaited_once()

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

    def test_retry_count_parses_string_header(self) -> None:
        message = MagicMock()
        message.headers = {"x-retry-count": "4"}
        assert _retry_count(message) == 4

    def test_retry_count_invalid_string_defaults_zero(self) -> None:
        message = MagicMock()
        message.headers = {"x-retry-count": "not-a-number"}
        assert _retry_count(message) == 0


class TestSendToRetry:
    async def test_publishes_with_incremented_retry_header(self) -> None:
        message = MagicMock()
        message.body = b"{}"
        message.content_type = "application/json"
        message.headers = {"x-retry-count": 1}

        retry_exchange = MagicMock()
        retry_exchange.publish = AsyncMock()

        with patch("features.notifications.consumer.broker._retry_exchange", retry_exchange):
            await _send_to_retry(message, "order.placed", 2)

        retry_exchange.publish.assert_awaited_once()
        published = retry_exchange.publish.call_args.args[0]
        assert published.headers["x-retry-count"] == 2


class TestHandleEvent:
    async def test_returns_staged_payload_when_claimed(self) -> None:
        event = _make_placed_event()
        staged = UserNotificationMessage(user_id=event.user_id, payload="{}")

        session = AsyncMock()
        session.info = {"notification_payload": staged}
        execute_result = MagicMock()
        execute_result.scalar_one_or_none.return_value = event.event_id
        session.execute = AsyncMock(return_value=execute_result)
        session_ctx = MagicMock()
        session_ctx.__aenter__ = AsyncMock(return_value=session)
        session_ctx.__aexit__ = AsyncMock(return_value=None)

        binding = MagicMock()
        binding.dispatch = AsyncMock()
        with patch(
            "features.notifications.consumer.db_helper.session_factory", return_value=session_ctx
        ):
            result = await _handle_event(binding, event, "order.placed")

        assert result == staged
        binding.dispatch.assert_awaited_once()

    async def test_returns_none_on_duplicate(self) -> None:
        event = _make_placed_event()
        session = AsyncMock()
        session.info = {}
        execute_result = MagicMock()
        execute_result.scalar_one_or_none.return_value = None
        session.execute = AsyncMock(return_value=execute_result)
        session.rollback = AsyncMock()
        session_ctx = MagicMock()
        session_ctx.__aenter__ = AsyncMock(return_value=session)
        session_ctx.__aexit__ = AsyncMock(return_value=None)

        binding = MagicMock()
        binding.dispatch = AsyncMock()
        with patch(
            "features.notifications.consumer.db_helper.session_factory", return_value=session_ctx
        ):
            result = await _handle_event(binding, event, "order.placed")

        assert result is None
        session.rollback.assert_awaited_once()


class TestParseMessageEvent:
    async def test_rejects_oversized_message(self) -> None:
        message = _make_message(b"x" * (64 * 1024 + 1))
        binding = _BINDINGS_BY_ROUTING_KEY["order.placed"]
        result = await _parse_message_event(message, binding, "order.placed")
        assert result is None
        message.nack.assert_awaited_once_with(requeue=False)

    async def test_rejects_invalid_payload(self) -> None:
        message = _make_message(b"{not valid json")
        binding = _BINDINGS_BY_ROUTING_KEY["order.placed"]
        result = await _parse_message_event(message, binding, "order.placed")
        assert result is None
        message.nack.assert_awaited_once_with(requeue=False)

    async def test_parses_valid_payload(self) -> None:
        event = _make_placed_event()
        message = _make_message(event.model_dump_json().encode())
        binding = _BINDINGS_BY_ROUTING_KEY["order.placed"]
        result = await _parse_message_event(message, binding, "order.placed")
        assert result is not None
        assert result.event_id == event.event_id
