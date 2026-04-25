import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class PromoCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=64)
    discount_type: Literal["PERCENT", "FIXED"]
    discount_value: int = Field(..., ge=1)
    restaurant_id: uuid.UUID
    max_uses: int | None = Field(None, ge=1)
    expires_at: datetime | None = None


class PromoResponse(BaseModel):
    id: uuid.UUID
    code: str
    discount_type: str
    discount_value: int
    restaurant_id: uuid.UUID
    max_uses: int | None
    used_count: int
    expires_at: datetime | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PromoValidateRequest(BaseModel):
    code: str
    restaurant_id: uuid.UUID


class PromoValidateResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: int
    discounted_amount: int | None = None
