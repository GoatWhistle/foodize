import uuid

from pydantic import BaseModel, ConfigDict, Field

from shared.enums.category import Category


class MenuItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    description: str | None = Field(None, max_length=512)
    price: int = Field(..., ge=1, le=100000000)
    category: Category = Category.SHAURMA
    prep_time_minutes: int = Field(15, ge=1, le=300)


class MenuItemUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    description: str | None = Field(None, max_length=512)
    price: int | None = Field(None, ge=1, le=100000000)
    category: Category | None = None
    is_available: bool | None = None
    prep_time_minutes: int | None = Field(None, ge=1, le=300)


class MenuItemResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    price: int
    category: Category
    restaurant_id: uuid.UUID
    is_available: bool
    prep_time_minutes: int
    photo_url: str | None = None

    model_config = ConfigDict(from_attributes=True)
