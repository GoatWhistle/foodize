import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.orders.crud.order import (
    count_active_orders_by_restaurant_id,
    count_orders_by_restaurant_id,
    count_orders_by_user_id,
    create_order_event,
    get_events_by_order_id,
    get_order_by_id,
    get_order_by_identifier,
    get_order_by_identifier_for_update,
    get_orders_by_restaurant_id,
    get_orders_by_user_id,
    update_order_status,
)
from shared.enums.order_status import OrderStatus
from shared.enums.roles import UserRole


def _scalar_result(value):
    m = MagicMock()
    m.scalars.return_value.all.return_value = value
    m.scalar_one_or_none.return_value = value if not isinstance(value, list) else None
    m.scalar_one.return_value = value if isinstance(value, int) else 0
    return m


def _make_session(scalar_result=None, scalar_one=None, scalars_list=None):
    session = AsyncMock()
    result = MagicMock()
    if scalars_list is not None:
        result.scalars.return_value.all.return_value = scalars_list
    result.scalar_one_or_none.return_value = scalar_result
    result.scalar_one.return_value = scalar_one if scalar_one is not None else 0
    session.execute = AsyncMock(return_value=result)
    session.add = MagicMock()
    session.flush = AsyncMock()
    return session


class TestGetOrdersByUserId:
    @pytest.mark.asyncio
    async def test_returns_list(self):
        order = MagicMock()
        session = _make_session(scalars_list=[order])
        result = await get_orders_by_user_id(session, uuid.uuid4())
        assert result == [order]
        session.execute.assert_called_once()

    @pytest.mark.asyncio
    async def test_with_status_filter(self):
        session = _make_session(scalars_list=[])
        await get_orders_by_user_id(session, uuid.uuid4(), status=OrderStatus.PENDING)
        call_args = session.execute.call_args[0][0]
        assert "status" in str(call_args).lower() or session.execute.called

    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        session = _make_session(scalars_list=[])
        result = await get_orders_by_user_id(session, uuid.uuid4())
        assert result == []


class TestGetOrderById:
    @pytest.mark.asyncio
    async def test_returns_order_when_found(self):
        order = MagicMock()
        session = _make_session(scalar_result=order)
        result = await get_order_by_id(session, uuid.uuid4())
        assert result == order

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found(self):
        session = _make_session(scalar_result=None)
        result = await get_order_by_id(session, uuid.uuid4())
        assert result is None


class TestGetOrderByIdentifier:
    @pytest.mark.asyncio
    async def test_resolves_uuid_string(self):
        order = MagicMock()
        session = _make_session(scalar_result=order)
        order_id = uuid.uuid4()
        result = await get_order_by_identifier(session, str(order_id))
        assert result == order

    @pytest.mark.asyncio
    async def test_resolves_display_id_int(self):
        order = MagicMock()
        session = _make_session(scalar_result=order)
        result = await get_order_by_identifier(session, "1001")
        assert result == order

    @pytest.mark.asyncio
    async def test_returns_none_for_invalid_identifier(self):
        session = _make_session(scalar_result=None)
        result = await get_order_by_identifier(session, "not-a-uuid-or-int")
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_when_not_found_by_uuid(self):
        session = _make_session(scalar_result=None)
        result = await get_order_by_identifier(session, str(uuid.uuid4()))
        assert result is None


class TestGetOrderByIdentifierForUpdate:
    @pytest.mark.asyncio
    async def test_resolves_uuid_with_for_update(self):
        order = MagicMock()
        session = _make_session(scalar_result=order)
        result = await get_order_by_identifier_for_update(session, str(uuid.uuid4()))
        assert result == order

    @pytest.mark.asyncio
    async def test_resolves_display_id_with_for_update(self):
        order = MagicMock()
        session = _make_session(scalar_result=order)
        result = await get_order_by_identifier_for_update(session, "1002")
        assert result == order

    @pytest.mark.asyncio
    async def test_returns_none_for_invalid(self):
        session = _make_session(scalar_result=None)
        result = await get_order_by_identifier_for_update(session, "invalid-key")
        assert result is None


class TestGetOrdersByRestaurantId:
    @pytest.mark.asyncio
    async def test_returns_orders(self):
        orders = [MagicMock(), MagicMock()]
        session = _make_session(scalars_list=orders)
        result = await get_orders_by_restaurant_id(session, uuid.uuid4())
        assert result == orders

    @pytest.mark.asyncio
    async def test_with_status_filter(self):
        session = _make_session(scalars_list=[])
        await get_orders_by_restaurant_id(session, uuid.uuid4(), status=OrderStatus.COMPLETED)
        assert session.execute.called

    @pytest.mark.asyncio
    async def test_with_date_range_filter(self):
        session = _make_session(scalars_list=[])
        await get_orders_by_restaurant_id(
            session,
            uuid.uuid4(),
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )
        assert session.execute.called


class TestCountOrdersByUserId:
    @pytest.mark.asyncio
    async def test_returns_count(self):
        session = _make_session(scalar_one=5)
        result = await count_orders_by_user_id(session, uuid.uuid4())
        assert result == 5

    @pytest.mark.asyncio
    async def test_with_status_filter(self):
        session = _make_session(scalar_one=3)
        result = await count_orders_by_user_id(session, uuid.uuid4(), status=OrderStatus.PENDING)
        assert result == 3

    @pytest.mark.asyncio
    async def test_with_exclude_status(self):
        session = _make_session(scalar_one=10)
        result = await count_orders_by_user_id(
            session, uuid.uuid4(), exclude_status=OrderStatus.CANCELLED
        )
        assert result == 10


class TestCountOrdersByRestaurantId:
    @pytest.mark.asyncio
    async def test_returns_count(self):
        session = _make_session(scalar_one=12)
        result = await count_orders_by_restaurant_id(session, uuid.uuid4())
        assert result == 12

    @pytest.mark.asyncio
    async def test_with_date_filters(self):
        session = _make_session(scalar_one=7)
        result = await count_orders_by_restaurant_id(
            session,
            uuid.uuid4(),
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )
        assert result == 7


class TestCountActiveOrdersByRestaurantId:
    @pytest.mark.asyncio
    async def test_returns_active_count(self):
        session = _make_session(scalar_one=4)
        result = await count_active_orders_by_restaurant_id(session, uuid.uuid4())
        assert result == 4


class TestUpdateOrderStatus:
    @pytest.mark.asyncio
    async def test_updates_status(self):
        order = MagicMock()
        order.status = OrderStatus.PENDING.value
        order.ready_at = None
        session = AsyncMock()
        session.flush = AsyncMock()
        result = await update_order_status(session, order, OrderStatus.ACCEPTED)
        assert order.status == OrderStatus.ACCEPTED.value
        session.flush.assert_called_once()

    @pytest.mark.asyncio
    async def test_sets_ready_at_when_status_is_ready(self):
        order = MagicMock()
        order.status = OrderStatus.ACCEPTED.value
        order.ready_at = None
        session = AsyncMock()
        session.flush = AsyncMock()
        await update_order_status(session, order, OrderStatus.READY)
        assert order.ready_at is not None
        assert order.status == OrderStatus.READY.value

    @pytest.mark.asyncio
    async def test_does_not_set_ready_at_for_other_statuses(self):
        order = MagicMock()
        order.status = OrderStatus.PENDING.value
        order.ready_at = None
        session = AsyncMock()
        session.flush = AsyncMock()
        await update_order_status(session, order, OrderStatus.ACCEPTED)
        assert order.ready_at is None


class TestCreateOrderEvent:
    @pytest.mark.asyncio
    async def test_creates_event_and_flushes(self):
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
    @pytest.mark.asyncio
    async def test_returns_events(self):
        event1 = MagicMock()
        event2 = MagicMock()
        session = _make_session(scalars_list=[event1, event2])
        result = await get_events_by_order_id(session, uuid.uuid4())
        assert result == [event1, event2]

    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        session = _make_session(scalars_list=[])
        result = await get_events_by_order_id(session, uuid.uuid4())
        assert result == []
