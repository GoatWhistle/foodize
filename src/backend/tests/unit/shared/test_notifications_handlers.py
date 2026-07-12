import logging
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from features.notifications.events import (
    FeedbackRequestedEvent,
    OrderPlacedEvent,
    OrderStatusChangedEvent,
)
from features.notifications.handlers import (
    handle_feedback_requested,
    handle_order_placed,
    handle_order_status_changed,
)
from shared.enums.order_status import OrderStatus


def _make_session() -> AsyncMock:
    session = AsyncMock()
    session.info = {}
    return session


def _make_placed_event() -> OrderPlacedEvent:
    return OrderPlacedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        total_price=1500,
        items_count=3,
    )


def _make_status_event() -> OrderStatusChangedEvent:
    return OrderStatusChangedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        old_status=OrderStatus.PENDING,
        new_status=OrderStatus.ACCEPTED,
        total_price=1500,
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


class TestHandlers:
    @pytest.mark.asyncio
    async def test_handle_order_placed_logs_and_stages_payload(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        event = _make_placed_event()
        session = _make_session()
        with (
            caplog.at_level(logging.INFO, logger="features.notifications.handlers"),
            patch(
                "features.notifications.handlers._create_user_notification",
                new_callable=AsyncMock,
                return_value="{}",
            ),
        ):
            await handle_order_placed(session, event)
        assert "order.placed" in caplog.text
        assert session.info["notification_payload"] == (event.user_id, "{}")

    @pytest.mark.asyncio
    async def test_handle_order_status_changed_logs(self, caplog: pytest.LogCaptureFixture) -> None:
        event = _make_status_event()
        session = _make_session()
        with (
            caplog.at_level(logging.INFO, logger="features.notifications.handlers"),
            patch(
                "features.notifications.handlers._create_user_notification",
                new_callable=AsyncMock,
                return_value="{}",
            ),
        ):
            await handle_order_status_changed(session, event)
        assert "order.status_changed" in caplog.text

    @pytest.mark.asyncio
    async def test_completed_status_enqueues_delayed_feedback(self) -> None:
        event = _make_completed_event()
        session = _make_session()
        enqueue = AsyncMock()
        with (
            patch(
                "features.notifications.handlers._create_user_notification",
                new_callable=AsyncMock,
                return_value="{}",
            ),
            patch("features.notifications.handlers.enqueue_event", enqueue),
        ):
            await handle_order_status_changed(session, event)
        enqueue.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_non_completed_status_does_not_enqueue_feedback(self) -> None:
        event = _make_status_event()
        session = _make_session()
        enqueue = AsyncMock()
        with (
            patch(
                "features.notifications.handlers._create_user_notification",
                new_callable=AsyncMock,
                return_value="{}",
            ),
            patch("features.notifications.handlers.enqueue_event", enqueue),
        ):
            await handle_order_status_changed(session, event)
        enqueue.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_handle_feedback_requested_stages_payload(self) -> None:
        event = FeedbackRequestedEvent(
            order_id=uuid.uuid4(),
            user_id=uuid.uuid4(),
            restaurant_id=uuid.uuid4(),
            restaurant_name="Test Cafe",
        )
        session = _make_session()
        with patch(
            "features.notifications.handlers._create_user_notification",
            new_callable=AsyncMock,
            return_value="{}",
        ):
            await handle_feedback_requested(session, event)
        assert session.info["notification_payload"] == (event.user_id, "{}")
