import uuid

from pydantic import BaseModel, Field


class MenuItemShort(BaseModel):
    id: uuid.UUID
    name: str
    price: int
    image_url: str | None = None


class CartSelectedOption(BaseModel):
    option_id: uuid.UUID
    name: str
    price_delta: int = Field(..., ge=0)


class CartItemResponse(BaseModel):
    menuItem: MenuItemShort
    quantity: int
    selected_option_ids: list[uuid.UUID] = []
    selected_options: list[CartSelectedOption] = []


class CartResponse(BaseModel):
    restaurant_id: uuid.UUID | None
    items: list[CartItemResponse]


class CartItemIn(BaseModel):
    menu_item_id: uuid.UUID
    name: str
    price: int = Field(..., ge=0)
    image_url: str | None = None
    quantity: int = Field(..., ge=1, le=99)
    selected_option_ids: list[uuid.UUID] = Field(default_factory=list, max_length=50)
    selected_options: list[CartSelectedOption] = Field(default_factory=list, max_length=50)


class CartUpdate(BaseModel):
    restaurant_id: uuid.UUID
    items: list[CartItemIn]
