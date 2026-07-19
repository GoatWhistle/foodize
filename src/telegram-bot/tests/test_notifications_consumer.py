import asyncio
import json
from unittest.mock import AsyncMock, patch

import pytest
from pytest_mock import MockerFixture

from config import bot_config
from notifications.consumer import _process, start_notification_consumer


def _make_redis(claim: bool = True) -> AsyncMock:
    redis = AsyncMock()
    redis.set.return_value = "OK" if claim else None
    return redis


async def test_process_notification_success(mocker: MockerFixture) -> None:
    redis = _make_redis(claim=True)
    mocker.patch("notifications.consumer.redis_client.get_client", return_value=redis)
    message = AsyncMock()
    message.body = json.dumps({"test": "data", "event_id": "evt-1"}).encode("utf-8")
    handler = AsyncMock()
    bot = AsyncMock()
    exchange = AsyncMock()

    await _process(message, handler, bot, exchange, "test_rk")

    handler.assert_called_once_with({"test": "data", "event_id": "evt-1"}, bot)
    redis.set.assert_awaited_once()
    assert redis.set.await_args.args[0] == "bot_event:evt-1"
    redis.delete.assert_not_called()
    message.ack.assert_called_once()


async def test_process_notification_deduplicates(mocker: MockerFixture) -> None:
    redis = _make_redis(claim=False)
    mocker.patch("notifications.consumer.redis_client.get_client", return_value=redis)
    message = AsyncMock()
    message.body = json.dumps({"test": "data", "event_id": "evt-dup"}).encode("utf-8")
    handler = AsyncMock()
    bot = AsyncMock()
    exchange = AsyncMock()

    await _process(message, handler, bot, exchange, "test_rk")

    handler.assert_not_called()
    redis.delete.assert_not_called()
    message.ack.assert_called_once()


async def test_process_notification_releases_claim_on_failure(mocker: MockerFixture) -> None:
    redis = _make_redis(claim=True)
    mocker.patch("notifications.consumer.redis_client.get_client", return_value=redis)
    mocker.patch("notifications.consumer.asyncio.sleep")
    message = AsyncMock()
    message.body = json.dumps({"test": "data", "event_id": "evt-fail"}).encode("utf-8")
    message.headers = {"x-retry-count": 0}
    message.delivery_mode = 2

    handler = AsyncMock(side_effect=Exception("Failed"))
    bot = AsyncMock()
    exchange = AsyncMock()

    await _process(message, handler, bot, exchange, "test_rk")

    redis.delete.assert_awaited_once_with("bot_event:evt-fail")


async def test_process_notification_invalid_json_dead_letters(mocker: MockerFixture) -> None:
    redis = _make_redis(claim=True)
    mocker.patch("notifications.consumer.redis_client.get_client", return_value=redis)
    mocker.patch("notifications.consumer.asyncio.sleep")
    message = AsyncMock()
    message.body = b"not-json{"
    message.headers = {"x-retry-count": 3}
    message.delivery_mode = 2

    handler = AsyncMock()
    bot = AsyncMock()
    exchange = AsyncMock()

    await _process(message, handler, bot, exchange, "test_rk")

    handler.assert_not_called()
    message.reject.assert_called_once_with(requeue=False)


async def test_process_notification_retry(mocker: MockerFixture) -> None:
    mock_sleep = mocker.patch("notifications.consumer.asyncio.sleep")
    message = AsyncMock()
    message.body = json.dumps({"test": "data"}).encode("utf-8")
    message.headers = {"x-retry-count": 1}
    message.delivery_mode = 2

    handler = AsyncMock(side_effect=Exception("Failed"))
    bot = AsyncMock()
    exchange = AsyncMock()

    await _process(message, handler, bot, exchange, "test_rk")

    message.ack.assert_called_once()
    exchange.publish.assert_called_once()
    published_msg = exchange.publish.call_args[0][0]
    assert published_msg.headers["x-retry-count"] == 2
    mock_sleep.assert_awaited_once()
    assert mock_sleep.call_args[0][0] == pytest.approx(4.0)


async def test_process_notification_dlq(mocker: MockerFixture) -> None:
    mocker.patch("notifications.consumer.asyncio.sleep")
    message = AsyncMock()
    message.body = json.dumps({"test": "data"}).encode("utf-8")
    message.headers = {"x-retry-count": 3}
    message.delivery_mode = 2

    handler = AsyncMock(side_effect=Exception("Failed"))
    bot = AsyncMock()
    exchange = AsyncMock()

    await _process(message, handler, bot, exchange, "test_rk")

    message.reject.assert_called_once_with(requeue=False)
    exchange.publish.assert_not_called()


async def test_start_notification_consumer_declares_topology(mocker: MockerFixture) -> None:
    mock_connect = mocker.patch("aio_pika.connect_robust")
    mock_conn = AsyncMock()
    mock_channel = AsyncMock()
    mock_queue = AsyncMock()

    mock_connect.return_value = mock_conn
    mock_conn.channel.return_value = mock_channel
    mock_channel.declare_queue.return_value = mock_queue

    bot = AsyncMock()

    with patch("asyncio.Future", side_effect=asyncio.CancelledError):
        with pytest.raises(asyncio.CancelledError):
            await start_notification_consumer(bot)

    mock_connect.assert_called_once_with(bot_config.rabbitmq_url)
    mock_channel.set_qos.assert_called_once_with(prefetch_count=10)
    mock_channel.declare_exchange.assert_any_call("foodize.events", "topic", durable=True)
    mock_channel.declare_exchange.assert_any_call("foodize.dlx", "topic", durable=True)
    assert mock_queue.bind.called
    assert mock_queue.consume.called
