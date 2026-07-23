import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

from features.notifications.consumer import (
    handle_event,
    install_signal_handlers,
    retry_or_dead_letter,
)
from features.notifications.consumer_bindings import BINDINGS_BY_ROUTING_KEY, EventBinding
from features.notifications.events import OrderPlacedEvent

from .notifications_consumer_helpers import make_placed_event


class TestEventBinding:
    def test_decode_parses_event(self) -> None:
        binding = BINDINGS_BY_ROUTING_KEY["order.placed"]
        event = make_placed_event()
        decoded = binding.decode(event.model_dump_json().encode())
        assert decoded.event_id == event.event_id

    async def test_dispatch_calls_handler(self) -> None:
        handler = AsyncMock()
        binding: EventBinding[OrderPlacedEvent] = EventBinding(
            queue_name="q",
            routing_key="order.placed",
            event_model=OrderPlacedEvent,
            handler=handler,
        )
        session = AsyncMock()
        event = make_placed_event()
        await binding.dispatch(session, event)
        handler.assert_awaited_once_with(session, event)


class TestRetryOrDeadLetter:
    async def test_retries_when_below_max(self) -> None:
        message = MagicMock()
        message.headers = {"x-retry-count": 1}
        message.ack = AsyncMock()
        message.nack = AsyncMock()
        send_retry = AsyncMock()

        with patch("features.notifications.consumer.send_to_retry", send_retry):
            await retry_or_dead_letter(message, "order.placed")

        send_retry.assert_awaited_once()
        message.ack.assert_awaited_once()
        message.nack.assert_not_awaited()

    async def test_dead_letters_at_max(self) -> None:
        message = MagicMock()
        message.headers = {"x-retry-count": 5}
        message.ack = AsyncMock()
        message.nack = AsyncMock()
        send_retry = AsyncMock()

        with patch("features.notifications.consumer.send_to_retry", send_retry):
            await retry_or_dead_letter(message, "order.placed")

        send_retry.assert_not_awaited()
        message.nack.assert_awaited_once_with(requeue=False)
        message.ack.assert_not_awaited()


class TestHandleEventStagedTypes:
    async def test_returns_none_when_staged_not_notification(self) -> None:
        event = make_placed_event()
        session = AsyncMock()
        session.info = {"notification_payload": {"not": "a message"}}
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
            result = await handle_event(binding, event, "order.placed")

        assert result is None
        session.commit.assert_awaited_once()

    async def test_returns_none_when_no_staged_payload(self) -> None:
        event = make_placed_event()
        session = AsyncMock()
        session.info = {}
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
            result = await handle_event(binding, event, "order.placed")

        assert result is None


class TestInstallSignalHandlers:
    async def test_registers_via_loop(self) -> None:
        stop_event = asyncio.Event()
        loop = MagicMock()
        with patch("features.notifications.consumer.asyncio.get_running_loop", return_value=loop):
            install_signal_handlers(stop_event)
        assert loop.add_signal_handler.call_count == 2

    async def test_falls_back_to_signal_signal(self) -> None:
        stop_event = asyncio.Event()
        loop = MagicMock()
        loop.add_signal_handler.side_effect = NotImplementedError
        with (
            patch("features.notifications.consumer.asyncio.get_running_loop", return_value=loop),
            patch("features.notifications.consumer.signal.signal") as signal_signal,
        ):
            install_signal_handlers(stop_event)
        assert signal_signal.call_count == 2
