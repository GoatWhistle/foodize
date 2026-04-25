import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from features.orders.schemas.order_item import OrderItemCreate, OrderItemResponse
from shared.enums.order_status import OrderStatus


class OrderCreate(BaseModel):
    restaurant_id: uuid.UUID
    items: list[OrderItemCreate] = Field(..., min_length=1)
    promo_code: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    restaurant_id: uuid.UUID
    status: OrderStatus
    total_price: int
    created_at: datetime
    ready_at: datetime | None = None
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)
