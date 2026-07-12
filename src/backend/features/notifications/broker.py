from urllib.parse import urlsplit, urlunsplit

import aio_pika
import aio_pika.abc
from prometheus_client import Gauge

from settings.config.app_config import settings
from utils.logging_setup import get_logger

logger = get_logger(__name__)

dlq_depth = Gauge(
    "rabbitmq_dlq_depth",
    "Number of dead-lettered messages waiting in the DLQ",
)


def _sanitize_amqp_url(url: str) -> str:
    parts = urlsplit(url)
    host = parts.hostname or ""
    if parts.port:
        host = f"{host}:{parts.port}"
    return urlunsplit((parts.scheme, host, parts.path, "", ""))


EXCHANGE_NAME = "foodize.events"
EXCHANGE_TYPE = aio_pika.ExchangeType.TOPIC
DLX_NAME = "foodize.dlx"
DLQ_NAME = "foodize.dlq"
RETRY_EXCHANGE_NAME = "foodize.retry"
RETRY_QUEUE_NAME = "foodize.retry.wait"
RETRY_TTL_MS = 30_000
PREFETCH_COUNT = 10


class RabbitMQBroker:
    def __init__(self, url: str) -> None:
        self._url = url
        self._connection: aio_pika.abc.AbstractRobustConnection | None = None
        self._channel: aio_pika.abc.AbstractChannel | None = None
        self._exchange: aio_pika.abc.AbstractExchange | None = None
        self._retry_exchange: aio_pika.abc.AbstractExchange | None = None

    async def connect(self) -> None:
        self._connection = await aio_pika.connect_robust(self._url)
        self._channel = await self._connection.channel()
        await self._channel.set_qos(prefetch_count=PREFETCH_COUNT)
        dlx = await self._channel.declare_exchange(
            DLX_NAME,
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )
        dlq = await self._channel.declare_queue(
            DLQ_NAME,
            durable=True,
        )
        await dlq.bind(dlx, routing_key="#")
        self._exchange = await self._channel.declare_exchange(
            EXCHANGE_NAME,
            EXCHANGE_TYPE,
            durable=True,
        )
        self._retry_exchange = await self._channel.declare_exchange(
            RETRY_EXCHANGE_NAME,
            aio_pika.ExchangeType.TOPIC,
            durable=True,
        )
        retry_queue = await self._channel.declare_queue(
            RETRY_QUEUE_NAME,
            durable=True,
            arguments={
                "x-message-ttl": RETRY_TTL_MS,
                "x-dead-letter-exchange": EXCHANGE_NAME,
            },
        )
        await retry_queue.bind(self._retry_exchange, routing_key="#")
        logger.info("rabbitmq_connected", url=_sanitize_amqp_url(self._url))

    async def disconnect(self) -> None:
        if self._connection and not self._connection.is_closed:
            await self._connection.close()
        logger.info("rabbitmq_disconnected")

    @property
    def is_connected(self) -> bool:
        return self._connection is not None and not self._connection.is_closed

    @property
    def exchange(self) -> aio_pika.abc.AbstractExchange:
        if self._exchange is None:
            raise RuntimeError("RabbitMQ broker is not connected. Call connect() first.")
        return self._exchange

    @property
    def channel(self) -> aio_pika.abc.AbstractChannel:
        if self._channel is None:
            raise RuntimeError("RabbitMQ broker is not connected. Call connect() first.")
        return self._channel

    @property
    def retry_exchange(self) -> aio_pika.abc.AbstractExchange:
        if self._retry_exchange is None:
            raise RuntimeError("RabbitMQ broker is not connected. Call connect() first.")
        return self._retry_exchange

    async def sample_dlq_depth(self) -> None:
        if self._channel is None:
            return
        try:
            queue = await self._channel.declare_queue(DLQ_NAME, durable=True, passive=True)
            dlq_depth.set(queue.declaration_result.message_count or 0)
        except Exception:
            logger.warning("dlq_depth_sample_failed")


broker = RabbitMQBroker(url=str(settings.rabbitmq.url))
