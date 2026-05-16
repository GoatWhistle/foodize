import uuid

from pydantic import BaseModel, ConfigDict, Field

from shared.enums.moderation_status import ModerationStatus


class RestaurantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    address: str = Field(min_length=1, max_length=256)
    is_hiring: bool = True
    is_open: bool = True


class RestaurantResponse(BaseModel):
    id: uuid.UUID
    display_id: str | None = None
    name: str
    address: str
    description: str | None = None
    vendor_id: uuid.UUID
    is_hiring: bool = True
    is_open: bool = True
    photo_url: str | None = None
    average_rating: float = 0.0
    review_count: int = 0
    orders_count_7d: int = 0
    moderation_status: str = ModerationStatus.PENDING.value
    rejection_reason: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RestaurantUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    address: str | None = Field(None, min_length=1, max_length=256)
    description: str | None = Field(None, max_length=1000)
    is_hiring: bool | None = None
    is_open: bool | None = None
    photo_url: str | None = Field(None, max_length=512)
