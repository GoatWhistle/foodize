import uuid
from datetime import date

from sqlalchemy.ext.asyncio import AsyncSession

from features.orders.crud import order as order_crud
from features.orders.exceptions import OrderAccessDeniedException, OrderNotFoundException
from features.orders.schemas.order import OrderLoadEstimate, OrderResponse
from features.orders.schemas.order_event import OrderEventResponse
from features.orders.services.order_utils import _is_ordering_paused
from features.restaurants import crud as restaurant_crud
from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.working_hours_crud import get_working_hours, is_open_now
from shared.enums.order_status import OrderStatus


async def estimate_restaurant_load(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    restaurant=None,
) -> OrderLoadEstimate:
    if restaurant is None:
        restaurant = await restaurant_crud.get_restaurant_by_id(session, restaurant_id)
    if not restaurant:
        raise RestaurantNotFoundException()

    active_orders = await order_crud.count_active_orders_by_restaurant_id(session, restaurant.id)
    if not isinstance(active_orders, int):
        active_orders = 0
    avg_prep_time = getattr(restaurant, "avg_prep_time_minutes", 15)
    if not isinstance(avg_prep_time, int):
        avg_prep_time = 15
    max_active_orders = getattr(restaurant, "max_active_orders", None)
    if not isinstance(max_active_orders, int):
        max_active_orders = None
    hours = await get_working_hours(session, restaurant.id)
    is_open = restaurant.is_open
    if hours and is_open_now(hours) is False:
        is_open = False
    queue_multiplier = 1
    if max_active_orders:
        queue_multiplier = max(1, active_orders // max_active_orders + 1)

    wait_min = max(avg_prep_time, avg_prep_time * queue_multiplier)
    wait_max = wait_min + max(10, avg_prep_time)
    paused = _is_ordering_paused(restaurant)

    return OrderLoadEstimate(
        restaurant_id=restaurant.id,
        ordering_available=not paused and is_open,
        reason="PAUSED" if paused else ("CLOSED" if not is_open else None),
        active_orders_count=active_orders,
        max_active_orders=max_active_orders,
        avg_prep_time_minutes=avg_prep_time,
        estimated_wait_min_minutes=wait_min,
        estimated_wait_max_minutes=wait_max,
        paused_until=restaurant.ordering_paused_until if paused else None,
    )


async def get_user_orders(
    session: AsyncSession,
    user_id: uuid.UUID,
    status: OrderStatus | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[OrderResponse], int]:
    offset = (page - 1) * size
    data = await order_crud.get_orders_by_user_id(
        session, user_id, status=status, offset=offset, limit=size
    )
    total = await order_crud.count_orders_by_user_id(session, user_id, status=status)
    return [OrderResponse.model_validate(o) for o in data], total


async def get_order(
    session: AsyncSession,
    order_id: uuid.UUID,
    user_id: uuid.UUID,
) -> OrderResponse:
    order = await order_crud.get_order_by_id(session, order_id)
    if not order:
        raise OrderNotFoundException()
    if order.user_id != user_id:
        raise OrderAccessDeniedException()
    return OrderResponse.model_validate(order)


async def get_restaurant_orders(
    session: AsyncSession,
    restaurant_id: uuid.UUID,
    status: OrderStatus | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    size: int = 20,
) -> tuple[list[OrderResponse], int]:
    offset = (page - 1) * size
    data = await order_crud.get_orders_by_restaurant_id(
        session, restaurant_id, status=status,
        date_from=date_from, date_to=date_to,
        offset=offset, limit=size,
    )
    total = await order_crud.count_orders_by_restaurant_id(
        session, restaurant_id, status=status,
        date_from=date_from, date_to=date_to,
    )
    return [OrderResponse.model_validate(o) for o in data], total


async def get_order_events(
    session: AsyncSession,
    order_id: uuid.UUID,
) -> list[OrderEventResponse]:
    events = await order_crud.get_events_by_order_id(session, order_id)
    return [OrderEventResponse.model_validate(e) for e in events]


async def get_order_by_identifier(session: AsyncSession, identifier: str):
    return await order_crud.get_order_by_identifier(session, identifier)
