import uuid

from pydantic import BaseModel, ConfigDict

from shared.enums.category import Category


class MenuItemCreate(BaseModel):
    name: str
    description: str | None = None
    price: int
    category: Category = Category.SHAURMA


class MenuItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    price: int
    category: Category
    restaurant_id: uuid.UUID

    model_config = ConfigDict(from_attributes=True)
