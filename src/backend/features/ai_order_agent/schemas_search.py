import uuid
from typing import NotRequired, TypedDict


class MenuItemText(TypedDict):
    name: str
    description: str | None


class MenuSearchItem(MenuItemText):
    menu_item_id: str
    price: int
    category: str
    restaurant_id: str
    restaurant_name: str
    restaurant_address: str
    _distance: NotRequired[float]


class MenuEmbeddingRow(TypedDict):
    menu_item_id: uuid.UUID
    model: str
    text_hash: str
    embedding: list[float]
