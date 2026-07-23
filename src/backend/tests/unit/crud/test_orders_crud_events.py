import uuid
from unittest.mock import AsyncMock, MagicMock

from features.orders.crud.order import (
    create_order_event,
    get_events_by_order_id,
    update_order_status,
)
from shared.enums.order_status import OrderStatus

from .orders_crud_helpers import make_orders_session


class TestUpdateOrderStatus:
    async def test_updates_status(self) -> None:
        order = MagicMock()
        order.status = OrderStatus.PENDING.value
        order.ready_at = None
        session = AsyncMock()
        session.flush = AsyncMock()
        await update_order_status(session, order, OrderStatus.ACCEPTED)
        assert order.status == OrderStatus.ACCEPTED.value
        session.flush.assert_called_once()

    async def test_sets_ready_at_when_status_is_ready(self) -> None:
        order = MagicMock()
        order.status = OrderStatus.ACCEPTED.value
        order.ready_at = None
        session = AsyncMock()
        session.flush = AsyncMock()
        await update_order_status(session, order, OrderStatus.READY)
        assert order.ready_at is not None
        assert order.status == OrderStatus.READY.value

    async def test_does_not_set_ready_at_for_other_statuses(self) -> None:
        order = MagicMock()
        order.status = OrderStatus.PENDING.value
        order.ready_at = None
        session = AsyncMock()
        session.flush = AsyncMock()
        await update_order_status(session, order, OrderStatus.ACCEPTED)
        assert order.ready_at is None


class TestCreateOrderEvent:
    async def test_creates_event_and_flushes(self) -> None:
        session = AsyncMock()
        session.add = MagicMock()
        session.flush = AsyncMock()
        actor_id = uuid.uuid4()
        order_id = uuid.uuid4()
        event = await create_order_event(
            session,
            order_id=order_id,
            actor_id=actor_id,
            actor_permissions=["customers:read"],
            old_status=OrderStatus.PENDING,
            new_status=OrderStatus.ACCEPTED,
        )
        session.add.assert_called_once()
        session.flush.assert_called_once()
        assert event.order_id == order_id
        assert event.actor_id == actor_id
        assert event.old_status == OrderStatus.PENDING.value
        assert event.new_status == OrderStatus.ACCEPTED.value


class TestGetEventsByOrderId:
    async def test_returns_events(self) -> None:
        event1 = MagicMock()
        event2 = MagicMock()
        session = make_orders_session(scalars_list=[event1, event2])
        result = await get_events_by_order_id(session, uuid.uuid4())
        assert result == [event1, event2]

    async def test_returns_empty_list(self) -> None:
        session = make_orders_session(scalars_list=[])
        result = await get_events_by_order_id(session, uuid.uuid4())
        assert result == []
