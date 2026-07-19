import uuid
from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock

from features.orders.schemas.order import OrderCreate, OrderLoadEstimate
from features.orders.schemas.order_item import OrderItemCreate
from shared.enums.order_status import OrderStatus


def make_order(
    status: OrderStatus = OrderStatus.PENDING,
    user_id: uuid.UUID | None = None,
    promo_id: uuid.UUID | None = None,
) -> MagicMock:
    order = MagicMock()
    order.id = uuid.uuid4()
    order.display_id = 1001
    order.user_id = user_id or uuid.uuid4()
    order.restaurant_id = uuid.uuid4()
    order.status = status.value
    order.total_price = 500
    order.comment = None
    order.cancellation_reason = None
    order.requested_pickup_at = None
    order.created_at = datetime.now(UTC)
    order.estimated_ready_at = None
    order.ready_at = None
    order.promo_id = promo_id
    order.items = []
    order.user = None
    order.restaurant = MagicMock()
    order.restaurant.display_id = "test-restaurant"
    order.restaurant.name = "Test Restaurant"
    order.restaurant.address = "Test Address"
    return order


def make_actor(permissions: list[str] | None = None) -> MagicMock:
    actor = MagicMock()
    actor.id = uuid.uuid4()
    actor.permissions = permissions or []
    return actor


def make_session() -> AsyncMock:
    session = AsyncMock()
    session.add = MagicMock()
    return session


def make_order_data(restaurant_id: uuid.UUID | None = None, **kwargs: Any) -> OrderCreate:
    rid = restaurant_id or uuid.uuid4()
    item_id = uuid.uuid4()
    return OrderCreate(
        restaurant_id=rid,
        items=[OrderItemCreate(menu_item_id=item_id, quantity=1, selected_option_ids=[])],
        **kwargs,
    )


def make_restaurant(is_open: bool = True, is_ordering_paused: bool = False) -> MagicMock:
    r = MagicMock()
    r.id = uuid.uuid4()
    r.name = "Test"
    r.is_open = is_open
    r.is_ordering_paused = is_ordering_paused
    r.ordering_paused_until = None
    r.avg_prep_time_minutes = 15
    r.max_active_orders = None
    return r


def make_menu_item(restaurant_id: uuid.UUID, available: bool = True) -> MagicMock:
    mi = MagicMock()
    mi.id = uuid.uuid4()
    mi.restaurant_id = restaurant_id
    mi.is_available = available
    mi.price = 100
    return mi


def make_order_event(new_status: OrderStatus = OrderStatus.ACCEPTED) -> MagicMock:
    event = MagicMock()
    event.id = uuid.uuid4()
    event.order_id = uuid.uuid4()
    event.actor_id = uuid.uuid4()
    event.actor_permissions = []
    event.old_status = OrderStatus.PENDING.value
    event.new_status = new_status.value
    event.created_at = datetime.now(UTC)
    return event


def make_load_estimate(restaurant_id: uuid.UUID) -> OrderLoadEstimate:
    return OrderLoadEstimate(
        restaurant_id=restaurant_id,
        ordering_available=True,
        active_orders_count=0,
        avg_prep_time_minutes=15,
        estimated_wait_min_minutes=15,
        estimated_wait_max_minutes=30,
    )
