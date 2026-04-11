import uuid

from pydantic import BaseModel, ConfigDict


class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = 1


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    quantity: int
    price_at_purchase: int

    model_config = ConfigDict(from_attributes=True)
