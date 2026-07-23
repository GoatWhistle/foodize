import uuid

from features.notifications.events import OrderPlacedEvent


def make_placed_event() -> OrderPlacedEvent:
    return OrderPlacedEvent(
        order_id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        restaurant_id=uuid.uuid4(),
        restaurant_name="Test Cafe",
        total_price=1500,
        items_count=3,
    )
