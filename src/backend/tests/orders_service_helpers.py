import uuid
from unittest.mock import MagicMock

from features.orders.schemas.order import OrderLoadEstimate
from shared.enums.order_status import OrderStatus


def make_mock_menu_item(
    item_id: uuid.UUID, price: int = 500, restaurant_id: uuid.UUID | None = None
):
    item = MagicMock()
    item.id = item_id
    item.price = price
    item.restaurant_id = restaurant_id or uuid.uuid4()
    item.is_available = True
    item.prep_time_minutes = 10
    item.option_groups = []
    return item


def make_mock_restaurant(restaurant_id: uuid.UUID, is_open: bool = True):
    r = MagicMock()
    r.id = restaurant_id
    r.is_open = is_open
    r.is_ordering_paused = False
    r.ordering_paused_until = None
    r.avg_prep_time_minutes = 15
    r.max_active_orders = None
    return r


def make_mock_order(
    order_id: uuid.UUID, user_id: uuid.UUID, status: str = OrderStatus.PENDING.value
):
    order = MagicMock()
    order.id = order_id
    order.display_id = 1001
    order.user_id = user_id
    order.restaurant_id = uuid.uuid4()
    order.status = status
    order.total_price = 500
    order.comment = None
    order.cancellation_reason = None
    order.requested_pickup_at = None
    order.created_at = "2026-01-01T00:00:00+00:00"
    order.estimated_ready_at = None
    order.ready_at = None
    order.items = []
    order.user = None
    order.restaurant = MagicMock()
    order.restaurant.display_id = "test-restaurant"
    order.restaurant.name = "Test Restaurant"
    order.restaurant.address = "Test Address"
    return order


def make_load_estimate(restaurant_id: uuid.UUID) -> OrderLoadEstimate:
    return OrderLoadEstimate(
        restaurant_id=restaurant_id,
        ordering_available=True,
        active_orders_count=0,
        avg_prep_time_minutes=15,
        estimated_wait_min_minutes=15,
        estimated_wait_max_minutes=30,
    )
