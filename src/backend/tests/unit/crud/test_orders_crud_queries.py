import uuid
from datetime import date
from unittest.mock import MagicMock

from features.orders.crud.order import (
    count_active_orders_by_restaurant_id,
    count_orders_by_restaurant_id,
    count_orders_by_user_id,
    get_order_by_id,
    get_order_by_identifier,
    get_order_by_identifier_for_update,
    get_orders_by_restaurant_id,
    get_orders_by_user_id,
)
from shared.enums.order_status import OrderStatus

from .orders_crud_helpers import make_orders_session


class TestGetOrdersByUserId:
    async def test_returns_list(self) -> None:
        order = MagicMock()
        session = make_orders_session(scalars_list=[order])
        result = await get_orders_by_user_id(session, uuid.uuid4())
        assert result == [order]
        session.execute.assert_called_once()

    async def test_with_status_filter(self) -> None:
        session = make_orders_session(scalars_list=[])
        await get_orders_by_user_id(session, uuid.uuid4(), status=OrderStatus.PENDING)
        rendered = str(session.execute.call_args[0][0]).lower()
        assert "status" in rendered
        assert "where" in rendered

    async def test_returns_empty_list(self) -> None:
        session = make_orders_session(scalars_list=[])
        result = await get_orders_by_user_id(session, uuid.uuid4())
        assert result == []


class TestGetOrderById:
    async def test_returns_order_when_found(self) -> None:
        order = MagicMock()
        session = make_orders_session(scalar_result=order)
        result = await get_order_by_id(session, uuid.uuid4())
        assert result == order

    async def test_returns_none_when_not_found(self) -> None:
        session = make_orders_session(scalar_result=None)
        result = await get_order_by_id(session, uuid.uuid4())
        assert result is None


class TestGetOrderByIdentifier:
    async def test_resolves_uuid_string(self) -> None:
        order = MagicMock()
        session = make_orders_session(scalar_result=order)
        order_id = uuid.uuid4()
        result = await get_order_by_identifier(session, str(order_id))
        assert result == order

    async def test_resolves_display_id_int(self) -> None:
        order = MagicMock()
        session = make_orders_session(scalar_result=order)
        result = await get_order_by_identifier(session, "1001")
        assert result == order

    async def test_returns_none_for_invalid_identifier(self) -> None:
        session = make_orders_session(scalar_result=None)
        result = await get_order_by_identifier(session, "not-a-uuid-or-int")
        assert result is None

    async def test_returns_none_when_not_found_by_uuid(self) -> None:
        session = make_orders_session(scalar_result=None)
        result = await get_order_by_identifier(session, str(uuid.uuid4()))
        assert result is None


class TestGetOrderByIdentifierForUpdate:
    async def test_resolves_uuid_with_for_update(self) -> None:
        order = MagicMock()
        session = make_orders_session(scalar_result=order)
        result = await get_order_by_identifier_for_update(session, str(uuid.uuid4()))
        assert result == order

    async def test_resolves_display_id_with_for_update(self) -> None:
        order = MagicMock()
        session = make_orders_session(scalar_result=order)
        result = await get_order_by_identifier_for_update(session, "1002")
        assert result == order
        session.execute.assert_called_once()

    async def test_returns_none_for_invalid(self) -> None:
        session = make_orders_session(scalar_result=None)
        result = await get_order_by_identifier_for_update(session, "invalid-key")
        assert result is None


class TestGetOrdersByRestaurantId:
    async def test_returns_orders(self) -> None:
        orders = [MagicMock(), MagicMock()]
        session = make_orders_session(scalars_list=orders)
        result = await get_orders_by_restaurant_id(session, uuid.uuid4())
        assert result == orders

    async def test_with_status_filter(self) -> None:
        session = make_orders_session(scalars_list=[])
        await get_orders_by_restaurant_id(session, uuid.uuid4(), status=OrderStatus.COMPLETED)
        assert session.execute.called

    async def test_with_date_range_filter(self) -> None:
        session = make_orders_session(scalars_list=[])
        await get_orders_by_restaurant_id(
            session,
            uuid.uuid4(),
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )
        assert session.execute.called


class TestCountOrdersByUserId:
    async def test_returns_count(self) -> None:
        session = make_orders_session(scalar_one=5)
        result = await count_orders_by_user_id(session, uuid.uuid4())
        assert result == 5

    async def test_with_status_filter(self) -> None:
        session = make_orders_session(scalar_one=3)
        result = await count_orders_by_user_id(session, uuid.uuid4(), status=OrderStatus.PENDING)
        assert result == 3

    async def test_with_exclude_status(self) -> None:
        session = make_orders_session(scalar_one=10)
        result = await count_orders_by_user_id(
            session, uuid.uuid4(), exclude_status=OrderStatus.CANCELLED
        )
        assert result == 10


class TestCountOrdersByRestaurantId:
    async def test_returns_count(self) -> None:
        session = make_orders_session(scalar_one=12)
        result = await count_orders_by_restaurant_id(session, uuid.uuid4())
        assert result == 12

    async def test_with_date_filters(self) -> None:
        session = make_orders_session(scalar_one=7)
        result = await count_orders_by_restaurant_id(
            session,
            uuid.uuid4(),
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31),
        )
        assert result == 7


class TestCountActiveOrdersByRestaurantId:
    async def test_returns_active_count(self) -> None:
        session = make_orders_session(scalar_one=4)
        result = await count_active_orders_by_restaurant_id(session, uuid.uuid4())
        assert result == 4
