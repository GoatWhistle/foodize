import uuid
from unittest.mock import MagicMock

from shared.enums.moderation_status import ModerationStatus


def make_restaurant_row(
    restaurant_id: uuid.UUID | None = None, vendor_id: uuid.UUID | None = None
) -> tuple[MagicMock, int]:
    restaurant = MagicMock()
    restaurant.id = restaurant_id or uuid.uuid4()
    restaurant.vendor_id = vendor_id or uuid.uuid4()
    restaurant.display_id = "test-cafe"
    restaurant.name = "Test Cafe"
    restaurant.address = "Test Street 1"
    restaurant.description = None
    restaurant.photo_url = None
    restaurant.is_hiring = True
    restaurant.is_open = True
    restaurant.moderation_status = ModerationStatus.APPROVED.value
    restaurant.rejection_reason = None
    return (restaurant, 10)


def make_restaurant(
    restaurant_id: uuid.UUID | None = None, vendor_id: uuid.UUID | None = None
) -> MagicMock:
    restaurant = MagicMock()
    restaurant.id = restaurant_id or uuid.uuid4()
    restaurant.vendor_id = vendor_id or uuid.uuid4()
    restaurant.display_id = "test-cafe"
    restaurant.name = "Test Cafe"
    restaurant.address = "Test Street 1"
    restaurant.description = None
    restaurant.photo_url = None
    restaurant.is_hiring = True
    restaurant.is_open = True
    restaurant.is_ordering_paused = False
    restaurant.ordering_paused_until = None
    restaurant.avg_prep_time_minutes = 15
    restaurant.max_active_orders = None
    restaurant.average_rating = 0.0
    restaurant.review_count = 0
    restaurant.orders_count_7d = 0
    restaurant.moderation_status = ModerationStatus.APPROVED.value
    restaurant.rejection_reason = None
    return restaurant


def empty_working_hours_result() -> MagicMock:
    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    return result
