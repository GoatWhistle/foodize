import asyncio
import uuid
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock, patch

from pydantic import JsonValue

from features.notifications import outbox_service
from features.notifications.outbox_service import (
    MAX_ATTEMPTS,
    backoff_delay,
    enqueue_event,
    mark_publish_failure,
    publish_pending_events,
    purge_stale_records,
    run_outbox_publisher,
    update_outbox_metrics,
)
from shared.enums.outbox_status import OutboxStatus


class _Event:
    def __init__(self) -> None:
        self.event_id = uuid.uuid4()
        self.event_type = "order.placed"

    def model_dump(self, *, mode: str = "json") -> dict[str, JsonValue]:
        del mode
        return {"foo": "bar"}


async def test_enqueue_event_adds_outbox_row() -> None:
    session = MagicMock()
    added: list[object] = []
    session.add = added.append

    outbox_event = await enqueue_event(session, _Event())

    assert outbox_event in added
    assert outbox_event.routing_key == "order.placed"
    assert outbox_event.payload == {"foo": "bar"}


async def test_enqueue_event_sets_run_at() -> None:
    session = MagicMock()
    session.add = MagicMock()
    run_at = datetime(2030, 1, 1, tzinfo=UTC)

    outbox_event = await enqueue_event(session, _Event(), run_at=run_at)

    assert outbox_event.run_at == run_at


def test_backoff_delay_grows_and_is_bounded() -> None:
    small = backoff_delay(1)
    large = backoff_delay(20)
    assert small >= 2.0
    assert large <= 300.0 + 5.0


def test_mark_publish_failure_schedules_retry() -> None:
    event = MagicMock()
    event.attempts = 0
    mark_publish_failure(event, RuntimeError("boom"), datetime.now(UTC))
    assert event.attempts == 1
    assert event.status != OutboxStatus.FAILED.value
    assert event.last_error == "boom"


def test_mark_publish_failure_marks_failed_at_max_attempts() -> None:
    event = MagicMock()
    event.attempts = MAX_ATTEMPTS - 1
    mark_publish_failure(event, RuntimeError("boom"), datetime.now(UTC))
    assert event.attempts == MAX_ATTEMPTS
    assert event.status == OutboxStatus.FAILED.value


async def test_publish_pending_events_publishes_and_marks() -> None:
    event = MagicMock()
    event.routing_key = "order.placed"
    event.payload = {"foo": "bar"}
    result = MagicMock()
    result.scalars.return_value.all.return_value = [event]
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()
    publisher = AsyncMock()

    published = await publish_pending_events(session, publisher=publisher, limit=10)

    assert published == 1
    assert event.status == OutboxStatus.PUBLISHED.value
    publisher.publish.assert_awaited_once_with("order.placed", {"foo": "bar"})


async def test_publish_pending_events_records_failure() -> None:
    event = MagicMock()
    event.attempts = 0
    event.routing_key = "order.placed"
    event.payload = {}
    result = MagicMock()
    result.scalars.return_value.all.return_value = [event]
    session = AsyncMock()
    session.execute = AsyncMock(return_value=result)
    session.commit = AsyncMock()
    publisher = AsyncMock()
    publisher.publish = AsyncMock(side_effect=RuntimeError("broker down"))

    published = await publish_pending_events(session, publisher=publisher)

    assert published == 0
    assert event.attempts == 1


async def test_update_outbox_metrics_with_pending_and_failed() -> None:
    session = AsyncMock()
    oldest = datetime(2020, 1, 1, tzinfo=UTC)
    session.scalar = AsyncMock(side_effect=[oldest, 3])

    await update_outbox_metrics(session)

    assert session.scalar.await_count == 2


async def test_update_outbox_metrics_with_no_events() -> None:
    session = AsyncMock()
    session.scalar = AsyncMock(side_effect=[None, None])

    await update_outbox_metrics(session)

    assert session.scalar.await_count == 2


async def test_purge_stale_records_sums_deletions() -> None:
    session = AsyncMock()
    delete_result = MagicMock()
    delete_result.rowcount = 2
    session.execute = AsyncMock(return_value=delete_result)
    session.commit = AsyncMock()

    removed = await purge_stale_records(session)

    assert removed == session.execute.await_count * delete_result.rowcount
    session.commit.assert_awaited_once()


async def test_run_outbox_publisher_runs_one_tick_then_stops() -> None:
    stop_event = asyncio.Event()

    session = AsyncMock()
    session_ctx = MagicMock()
    session_ctx.__aenter__ = AsyncMock(return_value=session)
    session_ctx.__aexit__ = AsyncMock(return_value=None)

    async def _publish(session: object) -> int:
        del session
        stop_event.set()
        return 0

    with (
        patch(
            "features.notifications.outbox_service.db_helper.session_factory",
            return_value=session_ctx,
        ),
        patch("features.notifications.outbox_service.broker.sample_dlq_depth", new=AsyncMock()),
        patch.object(outbox_service, "publish_pending_events", new=AsyncMock(side_effect=_publish)),
        patch.object(outbox_service, "update_outbox_metrics", new=AsyncMock()),
        patch.object(outbox_service, "purge_stale_records", new=AsyncMock(return_value=0)),
    ):
        await run_outbox_publisher(poll_interval=0.01, stop_event=stop_event)


async def test_run_outbox_publisher_survives_tick_error() -> None:
    stop_event = asyncio.Event()

    async def _boom(session: object) -> int:
        del session
        stop_event.set()
        raise RuntimeError("tick failure")

    session_ctx = MagicMock()
    session_ctx.__aenter__ = AsyncMock(return_value=AsyncMock())
    session_ctx.__aexit__ = AsyncMock(return_value=None)

    with (
        patch(
            "features.notifications.outbox_service.db_helper.session_factory",
            return_value=session_ctx,
        ),
        patch("features.notifications.outbox_service.broker.sample_dlq_depth", new=AsyncMock()),
        patch.object(outbox_service, "publish_pending_events", new=AsyncMock(side_effect=_boom)),
    ):
        await run_outbox_publisher(poll_interval=0.01, stop_event=stop_event)
