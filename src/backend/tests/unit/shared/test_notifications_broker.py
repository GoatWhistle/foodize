from unittest.mock import AsyncMock, MagicMock, patch

import aio_pika
import pytest

from features.notifications import broker as broker_module
from features.notifications.broker import (
    DLQ_NAME,
    EXCHANGE_NAME,
    RETRY_QUEUE_NAME,
    RabbitMQBroker,
    _sanitize_amqp_url,
)


def _make_channel() -> MagicMock:
    channel = MagicMock()
    channel.set_qos = AsyncMock()

    exchange = MagicMock()
    exchange.publish = AsyncMock()

    queue = MagicMock()
    queue.bind = AsyncMock()
    queue.declaration_result = MagicMock(message_count=7)

    channel.declare_exchange = AsyncMock(return_value=exchange)
    channel.declare_queue = AsyncMock(return_value=queue)
    return channel


def _make_connection(channel: MagicMock) -> MagicMock:
    connection = MagicMock()
    connection.is_closed = False
    connection.channel = AsyncMock(return_value=channel)
    connection.close = AsyncMock()
    return connection


class TestSanitizeAmqpUrl:
    def test_strips_credentials(self) -> None:
        sanitized = _sanitize_amqp_url("amqp://user:secret@rabbit:5672/vhost")
        assert "secret" not in sanitized
        assert "user" not in sanitized
        assert "rabbit:5672" in sanitized

    def test_handles_url_without_port(self) -> None:
        sanitized = _sanitize_amqp_url("amqp://host/path")
        assert sanitized == "amqp://host/path"


class TestConnect:
    async def test_connect_builds_topology(self) -> None:
        channel = _make_channel()
        connection = _make_connection(channel)
        instance = RabbitMQBroker(url="amqp://guest:guest@localhost/")

        with patch(
            "features.notifications.broker.aio_pika.connect_robust",
            AsyncMock(return_value=connection),
        ):
            await instance.connect()

        assert instance.is_connected is True
        channel.set_qos.assert_awaited_once()
        declared_queues = {call.args[0] for call in channel.declare_queue.await_args_list}
        assert DLQ_NAME in declared_queues
        assert RETRY_QUEUE_NAME in declared_queues
        declared_exchanges = {call.args[0] for call in channel.declare_exchange.await_args_list}
        assert EXCHANGE_NAME in declared_exchanges

    async def test_exchange_and_retry_exposed_after_connect(self) -> None:
        channel = _make_channel()
        connection = _make_connection(channel)
        instance = RabbitMQBroker(url="amqp://localhost/")

        with patch(
            "features.notifications.broker.aio_pika.connect_robust",
            AsyncMock(return_value=connection),
        ):
            await instance.connect()

        assert instance.exchange is not None
        assert instance.retry_exchange is not None
        assert instance.channel is channel


class TestPropertiesBeforeConnect:
    def test_exchange_raises_when_not_connected(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        with pytest.raises(RuntimeError):
            _ = instance.exchange

    def test_channel_raises_when_not_connected(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        with pytest.raises(RuntimeError):
            _ = instance.channel

    def test_retry_exchange_raises_when_not_connected(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        with pytest.raises(RuntimeError):
            _ = instance.retry_exchange

    def test_is_connected_false_when_no_connection(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        assert instance.is_connected is False


class TestDisconnect:
    async def test_disconnect_closes_open_connection(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        connection = MagicMock()
        connection.is_closed = False
        connection.close = AsyncMock()
        instance._connection = connection

        await instance.disconnect()

        connection.close.assert_awaited_once()

    async def test_disconnect_skips_already_closed(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        connection = MagicMock()
        connection.is_closed = True
        connection.close = AsyncMock()
        instance._connection = connection

        await instance.disconnect()

        connection.close.assert_not_awaited()

    async def test_disconnect_noop_when_never_connected(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        await instance.disconnect()
        assert instance.is_connected is False


class TestSampleDlqDepth:
    async def test_noop_when_channel_missing(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        await instance.sample_dlq_depth()

    async def test_sets_gauge_from_declaration(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        queue = MagicMock()
        queue.declaration_result = MagicMock(message_count=5)
        channel = MagicMock()
        channel.declare_queue = AsyncMock(return_value=queue)
        instance._channel = channel

        with patch.object(broker_module.dlq_depth, "set") as gauge_set:
            await instance.sample_dlq_depth()

        gauge_set.assert_called_once_with(5)

    async def test_swallows_declare_error(self) -> None:
        instance = RabbitMQBroker(url="amqp://localhost/")
        channel = MagicMock()
        channel.declare_queue = AsyncMock(side_effect=aio_pika.exceptions.ChannelClosed())
        instance._channel = channel

        await instance.sample_dlq_depth()
