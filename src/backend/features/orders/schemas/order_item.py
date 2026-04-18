import uuid

from pydantic import BaseModel, ConfigDict, model_validator

from shared.enums.category import Category


class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = 1


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    menu_item_name: str
    menu_item_category: Category
    quantity: int
    price_at_purchase: int

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def flatten_menu_item(cls, data):
        if hasattr(data, "menu_item"):
            mi = data.menu_item
            return {
                "id": data.id,
                "menu_item_id": data.menu_item_id,
                "menu_item_name": mi.name,
                "menu_item_category": mi.category,
                "quantity": data.quantity,
                "price_at_purchase": data.price_at_purchase,
            }
        return data
