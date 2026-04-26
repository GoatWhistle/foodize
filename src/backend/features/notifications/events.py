import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field

from shared.enums.order_status import OrderStatus


class OrderStatusChangedEvent(BaseModel):
    event_type: str = "order.status_changed"
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    order_id: uuid.UUID
    user_id: uuid.UUID
    restaurant_id: uuid.UUID
    restaurant_name: str
    old_status: OrderStatus
    new_status: OrderStatus
    total_price: int


class OrderPlacedEvent(BaseModel):
    event_type: str = "order.placed"
    event_id: uuid.UUID = Field(default_factory=uuid.uuid4)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    order_id: uuid.UUID
    user_id: uuid.UUID
    restaurant_id: uuid.UUID
    restaurant_name: str
    total_price: int
    items_count: int
