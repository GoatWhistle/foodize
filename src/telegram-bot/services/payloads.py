from typing import TypedDict


class VendorStatusPayload(TypedDict):
    is_vendor: bool
    approval_status: str | None
    rejection_reason: str | None


class OrderPayload(TypedDict):
    id: str
    display_id: str | int
    restaurant_name: str | None
    status: str
    total_price: int


class RegisterPayload(TypedDict):
    id: str
    telegram_id: int


class RestaurantPayload(TypedDict):
    id: str
    display_id: str
    name: str
