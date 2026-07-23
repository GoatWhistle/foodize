import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from features.orders.exceptions import DuplicateOptionsSelectedError
from shared.enums.category import Category


class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int = Field(1, ge=1, le=99)
    selected_option_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)

    @field_validator("selected_option_ids")
    @classmethod
    def selected_option_ids_must_be_unique(cls, value: list[uuid.UUID]) -> list[uuid.UUID]:
        if len(value) != len(set(value)):
            raise DuplicateOptionsSelectedError()
        return value


class OrderItemOptionResponse(BaseModel):
    id: uuid.UUID
    option_id: uuid.UUID | None
    name: str
    price_delta: int

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def flatten_option_snapshot(cls, data: object) -> object:
        if not hasattr(data, "name_snapshot"):
            return data
        return {
            "id": getattr(data, "id", None),
            "option_id": getattr(data, "option_id", None),
            "name": getattr(data, "name_snapshot", None),
            "price_delta": getattr(data, "price_delta_snapshot", None),
        }


class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    menu_item_name: str
    menu_item_category: Category
    menu_item_prep_time: int
    quantity: int
    price_at_purchase: int
    selected_options: list[OrderItemOptionResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def flatten_menu_item(cls, data: object) -> object:
        if not hasattr(data, "menu_item"):
            return data
        mi = getattr(data, "menu_item", None)
        return {
            "id": getattr(data, "id", None),
            "menu_item_id": getattr(data, "menu_item_id", None),
            "menu_item_name": getattr(mi, "name", None),
            "menu_item_category": getattr(mi, "category", None),
            "menu_item_prep_time": getattr(mi, "prep_time_minutes", None),
            "quantity": getattr(data, "quantity", None),
            "price_at_purchase": getattr(data, "price_at_purchase", None),
            "selected_options": getattr(data, "selected_options", None),
        }
