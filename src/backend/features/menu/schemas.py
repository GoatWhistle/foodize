import uuid

from pydantic import BaseModel, ConfigDict, Field

from shared.enums.category import Category


class MenuItemCreate(BaseModel):
    name: str
    description: str | None = None
    price: int = Field(..., le=100000000)
    category: Category = Category.SHAURMA
    prep_time_minutes: int = 15


class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: int | None = Field(None, le=100000000)
    category: Category | None = None
    is_available: bool | None = None
    prep_time_minutes: int | None = None


class MenuItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    price: int
    category: Category
    restaurant_id: uuid.UUID
    is_available: bool
    prep_time_minutes: int

    model_config = ConfigDict(from_attributes=True)
