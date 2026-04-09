import uuid
from typing import TYPE_CHECKING

from pydantic import BaseModel

from shared.enums.order_status import OrderStatus

if TYPE_CHECKING:
    pass


class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = 1


class OrderCreate(BaseModel):
    restaurant_id: uuid.UUID
    items: list[OrderItemCreate]


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    quantity: int
    price_at_purchase: int

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    restaurant_id: uuid.UUID
    status: OrderStatus
    total_price: int
    items: list[OrderItemResponse]

    class Config:
        from_attributes = True
