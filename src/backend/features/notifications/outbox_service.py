import asyncio
import contextlib
import random
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from prometheus_client import Gauge
from sqlalchemy import CursorResult, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.db_helper import db_helper
from features.notifications.broker import broker
from features.notifications.domain_event import DomainEvent
from features.notifications.outbox import OutboxEvent
from features.notifications.processed_event import ProcessedEvent
from features.orders.models.idempotency_key import IdempotencyKey
from infra.messaging.base import MessagePublisher
from infra.messaging.rabbitmq import get_rabbitmq_publisher
from shared.enums.event_type import EventType
from shared.enums.outbox_status import OutboxStatus
from utils.logging_setup import get_logger

logger = get_logger(__name__)

_ROUTING = {
    EventType.ORDER_PLACED.value: EventType.ORDER_PLACED.value,
    EventType.ORDER_STATUS_CHANGED.value: EventType.ORDER_STATUS_CHANGED.value,
    EventType.FEEDBACK_REQUESTED.value: EventType.FEEDBACK_REQUESTED.value,
}

_MAX_ATTEMPTS = 10
_BACKOFF_BASE_SECONDS = 2
_BACKOFF_MAX_SECONDS = 300
_BACKOFF_MAX_EXPONENT = 8
_BACKOFF_JITTER_SECONDS = 5.0

_OUTBOX_RETENTION_DAYS = 7
_IDEMPOTENCY_RETENTION_DAYS = 3
_RETENTION_INTERVAL_SECONDS = 3600.0

outbox_pending_oldest_age_seconds = Gauge(
    "outbox_pending_oldest_age_seconds",
    "Age in seconds of the oldest due but unpublished outbox event",
)
outbox_failed_total = Gauge(
    "outbox_failed_events",
    "Number of outbox events in FAILED state",
)


async def _update_outbox_metrics(session: AsyncSession) -> None:
    now = datetime.now(UTC)
    oldest = await session.scalar(
        select(func.min(OutboxEvent.created_at))
        .where(OutboxEvent.status == OutboxStatus.PENDING.value)
        .where(OutboxEvent.run_at <= now)
    )
    outbox_pending_oldest_age_seconds.set(
        (now - oldest).total_seconds() if oldest is not None else 0.0
    )
    failed = await session.scalar(
        select(func.count())
        .select_from(OutboxEvent)
        .where(OutboxEvent.status == OutboxStatus.FAILED.value)
    )
    outbox_failed_total.set(failed or 0)


async def enqueue_event(
    session: AsyncSession,
    event: DomainEvent,
    run_at: datetime | None = None,
) -> OutboxEvent:
    event_type = str(event.event_type)
    outbox_event = OutboxEvent(
        event_id=event.event_id,
        event_type=event_type,
        routing_key=_ROUTING.get(event_type, event_type),
        payload=event.model_dump(mode="json"),
    )
    if run_at is not None:
        outbox_event.run_at = run_at
    session.add(outbox_event)
    return outbox_event


def _backoff_delay(attempts: int) -> float:
    base = min(_BACKOFF_MAX_SECONDS, _BACKOFF_BASE_SECONDS ** min(attempts, _BACKOFF_MAX_EXPONENT))
    return float(base) + random.uniform(0, _BACKOFF_JITTER_SECONDS)


def _mark_publish_failure(event: OutboxEvent, exc: Exception, now: datetime) -> None:
    event.attempts += 1
    event.last_error = str(exc)
    if event.attempts >= _MAX_ATTEMPTS:
        event.status = OutboxStatus.FAILED.value
        logger.error(
            "outbox_event_permanently_failed",
            event_id=event.event_id,
            attempts=event.attempts,
        )
    else:
        event.next_attempt_at = now + timedelta(seconds=_backoff_delay(event.attempts))
        logger.exception("outbox_publish_failed", event_id=event.event_id)


async def publish_pending_events(
    session: AsyncSession,
    publisher: MessagePublisher | None = None,
    limit: int = 50,
) -> int:
    if publisher is None:
        publisher = get_rabbitmq_publisher()

    now = datetime.now(UTC)
    result = await session.execute(
        select(OutboxEvent)
        .where(OutboxEvent.status == OutboxStatus.PENDING.value)
        .where(OutboxEvent.next_attempt_at <= now)
        .where(OutboxEvent.run_at <= now)
        .order_by(OutboxEvent.created_at)
        .limit(limit)
        .with_for_update(skip_locked=True)
    )
    events = list(result.scalars().all())

    published = 0
    for event in events:
        try:
            await publisher.publish(event.routing_key, event.payload)
        except Exception as exc:
            _mark_publish_failure(event, exc, now)
        else:
            event.status = OutboxStatus.PUBLISHED.value
            event.published_at = datetime.now(UTC)
            event.last_error = None
            published += 1
        await session.commit()
    return published


async def purge_stale_records(session: AsyncSession) -> int:
    now = datetime.now(UTC)
    outbox_cutoff = now - timedelta(days=_OUTBOX_RETENTION_DAYS)
    idempotency_cutoff = now - timedelta(days=_IDEMPOTENCY_RETENTION_DAYS)

    processed_cutoff = now - timedelta(days=_OUTBOX_RETENTION_DAYS)

    outbox_result = cast(
        "CursorResult[Any]",
        await session.execute(
            delete(OutboxEvent)
            .where(
                OutboxEvent.status.in_([OutboxStatus.PUBLISHED.value, OutboxStatus.FAILED.value])
            )
            .where(OutboxEvent.created_at < outbox_cutoff)
        ),
    )
    idempotency_result = cast(
        "CursorResult[Any]",
        await session.execute(
            delete(IdempotencyKey).where(IdempotencyKey.created_at < idempotency_cutoff)
        ),
    )
    processed_result = cast(
        "CursorResult[Any]",
        await session.execute(
            delete(ProcessedEvent).where(ProcessedEvent.created_at < processed_cutoff)
        ),
    )
    await session.commit()
    removed = (
        (outbox_result.rowcount or 0)
        + (idempotency_result.rowcount or 0)
        + (processed_result.rowcount or 0)
    )
    if removed:
        logger.info(
            "retention_purge_done",
            outbox_removed=outbox_result.rowcount or 0,
            idempotency_removed=idempotency_result.rowcount or 0,
            processed_removed=processed_result.rowcount or 0,
        )
    return removed


async def run_outbox_publisher(
    poll_interval: float = 5.0,
    stop_event: asyncio.Event | None = None,
) -> None:
    logger.info("outbox_publisher_started")
    last_purge = 0.0
    loop = asyncio.get_running_loop()
    while stop_event is None or not stop_event.is_set():
        try:
            async with db_helper.session_factory() as session:
                await publish_pending_events(session)
                await _update_outbox_metrics(session)
            await broker.sample_dlq_depth()
        except Exception:
            logger.exception("outbox_publisher_tick_failed")
        if loop.time() - last_purge >= _RETENTION_INTERVAL_SECONDS:
            last_purge = loop.time()
            try:
                async with db_helper.session_factory() as session:
                    await purge_stale_records(session)
            except Exception:
                logger.exception("retention_purge_failed")
        if stop_event is None:
            await asyncio.sleep(poll_interval)
            continue
        with contextlib.suppress(TimeoutError):
            await asyncio.wait_for(stop_event.wait(), timeout=poll_interval)
    logger.info("outbox_publisher_stopped")
