import asyncio
import contextlib
from unittest.mock import AsyncMock, MagicMock, patch

from features.notifications import consumer as consumer_module
from features.notifications.consumer import main, start_consuming
from features.notifications.events import UserNotificationMessage

from .notifications_consumer_helpers import make_placed_event


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

        install_mock = MagicMock(side_effect=lambda ev: ev.set())

        with (
            patch("features.notifications.consumer.broker", broker),
            patch(
                "features.notifications.outbox_service.run_outbox_publisher",
                side_effect=_fake_outbox,
            ),
            patch("features.notifications.consumer.install_signal_handlers", install_mock),
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
                "features.notifications.consumer.install_signal_handlers",
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
            del stop_event
            await asyncio.Event().wait()

        with (
            patch("features.notifications.consumer.broker", broker),
            patch(
                "features.notifications.outbox_service.run_outbox_publisher",
                side_effect=_never_ending,
            ),
            patch(
                "features.notifications.consumer.install_signal_handlers",
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
            contextlib.suppress(RuntimeError),
        ):
            await main()

        broker.disconnect.assert_awaited_once()


class TestPublishPayloadIntegration:
    async def test_process_publishes_user_notification(self) -> None:
        event = make_placed_event()
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
                "features.notifications.consumer.handle_event",
                new_callable=AsyncMock,
                return_value=staged,
            ),
            patch("features.notifications.consumer.publish_user_notification", publish),
        ):
            await consumer_module.process_message(message, "order.placed")

        publish.assert_awaited_once_with(staged)
