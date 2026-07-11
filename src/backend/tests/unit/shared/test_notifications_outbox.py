import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.notifications.events import (
    FeedbackRequestedEvent,
    OrderPlacedEvent,
    OrderStatusChangedEvent,
)
from features.notifications.outbox_service import enqueue_event, publish_pending_events
from shared.enums.order_status import OrderStatus
from shared.enums.outbox_status import OutboxStatus


def _make_placed_event() -> OrderPlacedEvent:
    return OrderPlacedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        total_price=1500,
        items_count=3,
    )


def _make_completed_event() -> OrderStatusChangedEvent:
    return OrderStatusChangedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        old_status=OrderStatus.READY,
        new_status=OrderStatus.COMPLETED,
        total_price=1500,
    )


class TestOutboxService:
    @pytest.mark.asyncio
    async def test_enqueue_event_adds_outbox_record(self):
        session = MagicMock()
        event = _make_placed_event()

        outbox = await enqueue_event(session, event)

        assert outbox.event_id == event.event_id
        assert outbox.event_type == "order.placed"
        assert outbox.routing_key == "order.placed"
        assert outbox.payload["order_id"] == str(event.order_id)
        session.add.assert_called_once_with(outbox)

    @pytest.mark.asyncio
    async def test_enqueue_event_with_run_at_sets_run_at(self):
        session = MagicMock()
        event = _make_placed_event()
        run_at = datetime.now(timezone.utc) + timedelta(seconds=1800)

        outbox = await enqueue_event(session, event, run_at=run_at)

        assert outbox.run_at == run_at

    @pytest.mark.asyncio
    async def test_completed_status_enqueues_future_feedback_run_at(self):
        from features.notifications.handlers import handle_order_status_changed

        event = _make_completed_event()
        captured: dict = {}

        async def _fake_enqueue(session, evt, run_at=None):
            captured["event"] = evt
            captured["run_at"] = run_at

        session = AsyncMock()
        session.info = {}

        before = datetime.now(timezone.utc)
        with (
            patch(
                "features.notifications.handlers._create_user_notification",
                new_callable=AsyncMock,
                return_value="{}",
            ),
            patch("features.notifications.handlers.enqueue_event", _fake_enqueue),
        ):
            await handle_order_status_changed(session, event)

        assert isinstance(captured["event"], FeedbackRequestedEvent)
        assert captured["event"].order_id == event.order_id
        assert captured["run_at"] >= before + timedelta(seconds=1799)

    @pytest.mark.asyncio
    async def test_publish_pending_events_marks_successful_events_published(self):
        event = MagicMock()
        event.routing_key = "order.placed"
        event.payload = {"order_id": "1"}
        event.status = OutboxStatus.PENDING.value
        event.event_id = uuid.uuid4()
        event.last_error = "old error"

        result = MagicMock()
        result.scalars.return_value.all.return_value = [event]
        session = AsyncMock()
        session.execute = AsyncMock(return_value=result)
        publisher = AsyncMock()

        published = await publish_pending_events(session, publisher=publisher)

        assert published == 1
        publisher.publish.assert_awaited_once_with("order.placed", {"order_id": "1"})
        assert event.status == OutboxStatus.PUBLISHED.value
        assert event.published_at is not None
        assert event.last_error is None
        session.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_publish_pending_events_records_failure_and_backoff(self):
        event = MagicMock()
        event.routing_key = "order.placed"
        event.payload = {"order_id": "1"}
        event.status = OutboxStatus.PENDING.value
        event.event_id = uuid.uuid4()
        event.attempts = 0
        event.next_attempt_at = None

        result = MagicMock()
        result.scalars.return_value.all.return_value = [event]
        session = AsyncMock()
        session.execute = AsyncMock(return_value=result)
        publisher = AsyncMock()
        publisher.publish.side_effect = RuntimeError("broker down")

        published = await publish_pending_events(session, publisher=publisher)

        assert published == 0
        assert event.attempts == 1
        assert event.last_error == "broker down"
        assert event.next_attempt_at is not None
        assert event.status == OutboxStatus.PENDING.value
        session.commit.assert_awaited_once()
