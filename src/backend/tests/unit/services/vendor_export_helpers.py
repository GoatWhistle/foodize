import uuid
from datetime import UTC, datetime
from unittest.mock import MagicMock

from shared.enums.order_status import OrderStatus


def make_vendor(restaurant_ids: list[uuid.UUID]) -> MagicMock:
    vendor = MagicMock()
    vendor.id = uuid.uuid4()
    vendor.restaurants = [MagicMock(id=rid) for rid in restaurant_ids]
    return vendor


def make_order(restaurant_id: uuid.UUID, *, with_relations: bool = True) -> MagicMock:
    order = MagicMock()
    order.id = uuid.uuid4()
    order.display_id = "A-101"
    order.restaurant_id = restaurant_id
    order.status = OrderStatus.COMPLETED.value
    order.total_price = 1500
    order.items = [MagicMock(), MagicMock()]
    order.created_at = datetime(2026, 1, 15, 12, 0, tzinfo=UTC)
    if with_relations:
        order.user = MagicMock(name="Клиент")
        order.user.name = "Клиент"
        order.restaurant = MagicMock()
        order.restaurant.name = "Тест Кафе"
    else:
        order.user = None
        order.restaurant = None
    return order


def make_menu_item(restaurant_id: uuid.UUID, *, deleted: bool = False) -> MagicMock:
    item = MagicMock()
    item.id = uuid.uuid4()
    item.name = "Пицца"
    item.category = "pizza"
    item.price = 500
    item.is_available = True
    item.is_deleted = deleted
    item.restaurant_id = restaurant_id
    return item


def make_promo() -> MagicMock:
    promo = MagicMock()
    promo.code = "SAVE10"
    promo.discount_type = "percent"
    promo.discount_value = 10
    promo.max_uses = None
    promo.used_count = 3
    promo.is_active = True
    promo.created_at = datetime(2026, 1, 10, 9, 0, tzinfo=UTC)
    return promo
