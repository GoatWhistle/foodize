import uuid

from pydantic import BaseModel


class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = 1


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    quantity: int
    price_at_purchase: int

    class Config:
        from_attributes = True
