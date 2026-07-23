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
    requested_pickup_at: datetime | None = None
    redeem_points: int = Field(0, ge=0)
    loyalty_reward_id: uuid.UUID | None = None


class OrderLoadEstimate(BaseModel):
    restaurant_id: uuid.UUID
    ordering_available: bool
    reason: str | None = None
    active_orders_count: int
    max_active_orders: int | None = None
    avg_prep_time_minutes: int
    estimated_wait_min_minutes: int
    estimated_wait_max_minutes: int
    paused_until: datetime | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
    estimated_ready_in_minutes: int | None = Field(None, ge=1, le=240)
    estimated_ready_at: datetime | None = None


class OrderCancelRequest(BaseModel):
    reason: str | None = Field(None, max_length=500)


class OrderResponse(BaseModel):
    id: uuid.UUID
    display_id: int
    user_id: uuid.UUID
    customer_name: str | None = None
    customer_phone: str | None = None
    restaurant_id: uuid.UUID
    restaurant_display_id: str | None = None
    restaurant_name: str | None = None
    restaurant_address: str | None = None
    status: OrderStatus
    total_price: int
    comment: str | None = None
    cancellation_reason: str | None = None
    requested_pickup_at: datetime | None = None
    created_at: datetime
    estimated_ready_at: datetime | None = None
    ready_at: datetime | None = None
    items: list[OrderItemResponse]

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def flatten_relations(cls, data: object) -> object:
        if isinstance(data, dict):
            return data

        result: dict[str, object] = {
            "id": getattr(data, "id", None),
            "display_id": getattr(data, "display_id", None),
            "user_id": getattr(data, "user_id", None),
            "restaurant_id": getattr(data, "restaurant_id", None),
            "status": getattr(data, "status", None),
            "total_price": getattr(data, "total_price", None),
            "comment": getattr(data, "comment", None),
            "cancellation_reason": getattr(data, "cancellation_reason", None),
            "requested_pickup_at": getattr(data, "requested_pickup_at", None),
            "created_at": getattr(data, "created_at", None),
            "estimated_ready_at": getattr(data, "estimated_ready_at", None),
            "ready_at": getattr(data, "ready_at", None),
            "items": getattr(data, "items", None),
        }

        user = getattr(data, "user", None)
        if user is not None:
            first_last = " ".join(
                part
                for part in [getattr(user, "first_name", None), getattr(user, "last_name", None)]
                if part
            ).strip()
            result["customer_name"] = first_last or getattr(user, "name", None)
            result["customer_phone"] = getattr(user, "phone_number", None)

        restaurant = getattr(data, "restaurant", None)
        if restaurant is not None:
            result["restaurant_display_id"] = getattr(restaurant, "display_id", None)
            result["restaurant_name"] = getattr(restaurant, "name", None)
            result["restaurant_address"] = getattr(restaurant, "address", None)

        return result
