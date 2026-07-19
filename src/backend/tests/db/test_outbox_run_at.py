import uuid
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

from sqlalchemy.ext.asyncio import AsyncSession

from features.notifications.events import FeedbackRequestedEvent
from features.notifications.outbox import OutboxEvent
from features.notifications.outbox_service import enqueue_event, publish_pending_events
from shared.enums.outbox_status import OutboxStatus


def _make_feedback_event() -> FeedbackRequestedEvent:
    return FeedbackRequestedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
    )


class TestOutboxRunAt:
    async def test_publisher_skips_immature_run_at(self, db_session: AsyncSession) -> None:
        run_at = datetime.now(UTC) + timedelta(seconds=1800)
        await enqueue_event(db_session, _make_feedback_event(), run_at=run_at)
        await db_session.commit()

        publisher = AsyncMock()
        published = await publish_pending_events(db_session, publisher=publisher)

        assert published == 0
        publisher.publish.assert_not_awaited()

    async def test_publisher_selects_mature_run_at(self, db_session: AsyncSession) -> None:
        run_at = datetime.now(UTC) - timedelta(seconds=1)
        await enqueue_event(db_session, _make_feedback_event(), run_at=run_at)
        await db_session.commit()

        publisher = AsyncMock()
        published = await publish_pending_events(db_session, publisher=publisher)

        assert published == 1
        publisher.publish.assert_awaited_once()

    async def test_immature_event_publishes_once_mature(self, db_session: AsyncSession) -> None:
        event = _make_feedback_event()
        run_at = datetime.now(UTC) + timedelta(seconds=1800)
        outbox = await enqueue_event(db_session, event, run_at=run_at)
        await db_session.commit()

        publisher = AsyncMock()
        assert await publish_pending_events(db_session, publisher=publisher) == 0

        outbox.run_at = datetime.now(UTC) - timedelta(seconds=1)
        await db_session.commit()

        assert await publish_pending_events(db_session, publisher=publisher) == 1
        assert outbox.status == OutboxStatus.PUBLISHED.value

    async def test_default_run_at_is_immediately_mature(self, db_session: AsyncSession) -> None:
        outbox = OutboxEvent(
            event_id=uuid.uuid4(),
            event_type="order.placed",
            routing_key="order.placed",
            payload={"order_id": "1"},
        )
        db_session.add(outbox)
        await db_session.commit()

        publisher = AsyncMock()
        published = await publish_pending_events(db_session, publisher=publisher)

        assert published == 1
