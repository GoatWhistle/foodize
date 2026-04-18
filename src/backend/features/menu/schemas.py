import uuid

from pydantic import BaseModel, ConfigDict

from shared.enums.category import Category


class MenuItemCreate(BaseModel):
    name: str
    description: str | None = None
    price: int
    category: Category = Category.SHAURMA


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: int | None = None
    category: Category | None = None
    is_available: bool | None = None


class MenuItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    price: int
    category: Category
    restaurant_id: uuid.UUID
    is_available: bool

    model_config = ConfigDict(from_attributes=True)
