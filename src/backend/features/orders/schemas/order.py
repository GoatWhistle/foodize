import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from features.orders.schemas.order_item import OrderItemCreate, OrderItemResponse
from shared.enums.order_status import OrderStatus


class OrderCreate(BaseModel):
    restaurant_id: uuid.UUID
    items: list[OrderItemCreate] = Field(..., min_length=1, max_length=50)
    promo_code: str | None = Field(None, min_length=3, max_length=64)
    comment: str | None = Field(None, max_length=500)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    estimated_ready_in_minutes: int | None = Field(None, ge=1, le=240)
    estimated_ready_at: datetime | None = None


class OrderResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    customer_name: str | None = None
    customer_phone: str | None = None
    restaurant_id: uuid.UUID
    status: OrderStatus
    total_price: int
    comment: str | None = None
    created_at: datetime
    estimated_ready_at: datetime | None = None
    ready_at: datetime | None = None
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def flatten_customer(cls, data):
        if hasattr(data, "user") and data.user is not None:
            user = data.user
            first_last = " ".join(
                part for part in [user.first_name, user.last_name] if part
            ).strip()
            return {
                "id": data.id,
                "user_id": data.user_id,
                "customer_name": first_last or user.name,
                "customer_phone": user.phone_number,
                "restaurant_id": data.restaurant_id,
                "status": data.status,
                "total_price": data.total_price,
                "comment": data.comment,
                "created_at": data.created_at,
                "estimated_ready_at": data.estimated_ready_at,
                "ready_at": data.ready_at,
                "items": data.items,
            }
        return data
