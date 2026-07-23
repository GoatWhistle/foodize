import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from features.notifications.push_models import PushPlatform


class PushDeviceRegisterRequest(BaseModel):
    token: str = Field(min_length=1, max_length=512)
    platform: PushPlatform
    language: str | None = Field(default=None, max_length=8)


class PushDeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    token: str
    platform: str
    language: str | None = None
    is_active: bool
    created_at: datetime
