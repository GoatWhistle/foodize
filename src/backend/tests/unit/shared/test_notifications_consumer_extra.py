import asyncio
import contextlib
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

from features.notifications import consumer as consumer_module
from features.notifications.consumer import (
    _BINDINGS_BY_ROUTING_KEY,
    EventBinding,
    _handle_event,
    _install_signal_handlers,
    _retry_or_dead_letter,
    main,
    start_consuming,
)
from features.notifications.events import OrderPlacedEvent, UserNotificationMessage


def _make_placed_event() -> OrderPlacedEvent:
    return OrderPlacedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        total_price=1500,
        items_count=3,
    )


class TestEventBinding:
    def test_decode_parses_event(self) -> None:
        binding = _BINDINGS_BY_ROUTING_KEY["order.placed"]
        event = _make_placed_event()
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
        event = _make_placed_event()
        await binding.dispatch(session, event)
        handler.assert_awaited_once_with(session, event)


class TestRetryOrDeadLetter:
    async def test_retries_when_below_max(self) -> None:
        message = MagicMock()
        message.headers = {"x-retry-count": 1}
        message.ack = AsyncMock()
        message.nack = AsyncMock()
        send_retry = AsyncMock()

        with patch("features.notifications.consumer._send_to_retry", send_retry):
            await _retry_or_dead_letter(message, "order.placed")

        send_retry.assert_awaited_once()
        message.ack.assert_awaited_once()
        message.nack.assert_not_awaited()

    async def test_dead_letters_at_max(self) -> None:
        message = MagicMock()
        message.headers = {"x-retry-count": 5}
        message.ack = AsyncMock()
        message.nack = AsyncMock()
        send_retry = AsyncMock()

        with patch("features.notifications.consumer._send_to_retry", send_retry):
            await _retry_or_dead_letter(message, "order.placed")

        send_retry.assert_not_awaited()
        message.nack.assert_awaited_once_with(requeue=False)
        message.ack.assert_not_awaited()


class TestHandleEventStagedTypes:
    async def test_returns_none_when_staged_not_notification(self) -> None:
        event = _make_placed_event()
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
            result = await _handle_event(binding, event, "order.placed")

        assert result is None
        session.commit.assert_awaited_once()

    async def test_returns_none_when_no_staged_payload(self) -> None:
        event = _make_placed_event()
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
            result = await _handle_event(binding, event, "order.placed")

        assert result is None


class TestInstallSignalHandlers:
    async def test_registers_via_loop(self) -> None:
        stop_event = asyncio.Event()
        loop = MagicMock()
        with patch("features.notifications.consumer.asyncio.get_running_loop", return_value=loop):
            _install_signal_handlers(stop_event)
        assert loop.add_signal_handler.call_count == 2

    async def test_falls_back_to_signal_signal(self) -> None:
        stop_event = asyncio.Event()
        loop = MagicMock()
        loop.add_signal_handler.side_effect = NotImplementedError
        with (
            patch("features.notifications.consumer.asyncio.get_running_loop", return_value=loop),
            patch("features.notifications.consumer.signal.signal") as signal_signal,
        ):
            _install_signal_handlers(stop_event)
        assert signal_signal.call_count == 2


class TestStartConsuming:
    async def test_declares_binds_and_drains(self) -> None:
        queue = MagicMock()
        queue.name = "notifications.order.placed"
        queue.bind = AsyncMock()
        queue.consume = AsyncMock(return_value="tag-1")
        queue.cancel = AsyncMock()

        channel = MagicMock()
        channel.declare_queue = AsyncMock(return_value=queue)

        broker = MagicMock()
        broker.connect = AsyncMock()
        broker.channel = channel
        broker.exchange = MagicMock()

        async def _fake_outbox(stop_event: asyncio.Event) -> None:
            await stop_event.wait()

        async def _set_stop() -> None:
            await asyncio.sleep(0)
            for call in install_mock.call_args_list:
                call.args[0].set()

        install_mock = MagicMock(side_effect=lambda ev: ev.set())

        with (
            patch("features.notifications.consumer.broker", broker),
            patch(
                "features.notifications.outbox_service.run_outbox_publisher",
                side_effect=_fake_outbox,
            ),
            patch("features.notifications.consumer._install_signal_handlers", install_mock),
            patch("features.notifications.consumer.worker_broker_connected"),
        ):
            await start_consuming()

        broker.connect.assert_awaited_once()
        assert channel.declare_queue.await_count == 3
        queue.consume.assert_awaited()
        queue.cancel.assert_awaited()

    async def test_cancel_failure_is_logged_not_raised(self) -> None:
        queue = MagicMock()
        queue.name = "q"
        queue.bind = AsyncMock()
        queue.consume = AsyncMock(return_value="tag")
        queue.cancel = AsyncMock(side_effect=RuntimeError("boom"))

        channel = MagicMock()
        channel.declare_queue = AsyncMock(return_value=queue)

        broker = MagicMock()
        broker.connect = AsyncMock()
        broker.channel = channel
        broker.exchange = MagicMock()

        async def _fake_outbox(stop_event: asyncio.Event) -> None:
            await stop_event.wait()

        with (
            patch("features.notifications.consumer.broker", broker),
            patch(
                "features.notifications.outbox_service.run_outbox_publisher",
                side_effect=_fake_outbox,
            ),
            patch(
                "features.notifications.consumer._install_signal_handlers",
                side_effect=lambda ev: ev.set(),
            ),
            patch("features.notifications.consumer.worker_broker_connected"),
        ):
            await start_consuming()

        queue.cancel.assert_awaited()

    async def test_outbox_drain_timeout_cancels_task(self) -> None:
        queue = MagicMock()
        queue.name = "q"
        queue.bind = AsyncMock()
        queue.consume = AsyncMock(return_value="tag")
        queue.cancel = AsyncMock()

        channel = MagicMock()
        channel.declare_queue = AsyncMock(return_value=queue)

        broker = MagicMock()
        broker.connect = AsyncMock()
        broker.channel = channel
        broker.exchange = MagicMock()

        async def _never_ending(stop_event: asyncio.Event) -> None:
            await asyncio.Event().wait()

        with (
            patch("features.notifications.consumer.broker", broker),
            patch(
                "features.notifications.outbox_service.run_outbox_publisher",
                side_effect=_never_ending,
            ),
            patch(
                "features.notifications.consumer._install_signal_handlers",
                side_effect=lambda ev: ev.set(),
            ),
            patch("features.notifications.consumer._DRAIN_TIMEOUT_SECONDS", 0.01),
            patch("features.notifications.consumer.worker_broker_connected"),
        ):
            await start_consuming()

        queue.cancel.assert_awaited()


class TestMain:
    async def test_main_disconnects_in_finally(self) -> None:
        broker = MagicMock()
        broker.disconnect = AsyncMock()

        with (
            patch("features.notifications.consumer.broker", broker),
            patch("features.notifications.consumer.configure_logging"),
            patch("features.notifications.consumer._start_metrics_server"),
            patch(
                "features.notifications.consumer.start_consuming",
                new_callable=AsyncMock,
            ),
            patch("features.notifications.consumer.worker_broker_connected"),
        ):
            await main()

        broker.disconnect.assert_awaited_once()

    async def test_main_disconnects_even_on_error(self) -> None:
        broker = MagicMock()
        broker.disconnect = AsyncMock()

        with (
            patch("features.notifications.consumer.broker", broker),
            patch("features.notifications.consumer.configure_logging"),
            patch("features.notifications.consumer._start_metrics_server"),
            patch(
                "features.notifications.consumer.start_consuming",
                new_callable=AsyncMock,
                side_effect=RuntimeError("fail"),
            ),
            patch("features.notifications.consumer.worker_broker_connected"),
        ):
            with contextlib.suppress(RuntimeError):
                await main()

        broker.disconnect.assert_awaited_once()


class TestPublishPayloadIntegration:
    async def test_process_publishes_user_notification(self) -> None:
        event = _make_placed_event()
        staged = UserNotificationMessage(user_id=event.user_id, payload="{}")

        message = MagicMock()
        message.body = event.model_dump_json().encode()
        message.headers = {}
        message.content_type = "application/json"
        message.nack = AsyncMock()
        message.ack = AsyncMock()
        message.process = MagicMock(
            return_value=MagicMock(__aenter__=AsyncMock(), __aexit__=AsyncMock())
        )

        publish = AsyncMock()
        with (
            patch(
                "features.notifications.consumer._handle_event",
                new_callable=AsyncMock,
                return_value=staged,
            ),
            patch("features.notifications.consumer._publish_user_notification", publish),
        ):
            await consumer_module._process_message(message, "order.placed")

        publish.assert_awaited_once_with(staged)
