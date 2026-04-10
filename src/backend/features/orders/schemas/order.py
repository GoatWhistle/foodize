import uuid

from pydantic import BaseModel

from features.orders.schemas.order_item import OrderItemCreate, OrderItemResponse
from shared.enums.order_status import OrderStatus


class OrderCreate(BaseModel):
    restaurant_id: uuid.UUID
    items: list[OrderItemCreate]


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    restaurant_id: uuid.UUID
    status: OrderStatus
    total_price: int
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True
