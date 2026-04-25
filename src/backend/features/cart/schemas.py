import uuid

from pydantic import BaseModel


class MenuItemShort(BaseModel):
    id: uuid.UUID
    name: str
    price: float
    image_url: str | None = None


class CartItemResponse(BaseModel):
    menuItem: MenuItemShort
    quantity: int


class CartResponse(BaseModel):
    restaurant_id: uuid.UUID | None
    items: list[CartItemResponse]


class CartItemIn(BaseModel):
    menu_item_id: uuid.UUID
    name: str
    price: float
    image_url: str | None = None
    quantity: int


class CartUpdate(BaseModel):
    restaurant_id: uuid.UUID
    items: list[CartItemIn]
