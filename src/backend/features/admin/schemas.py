import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from shared.enums.roles import UserRole


class AdminUserResponse(BaseModel):
    id: uuid.UUID
    name: str
    phone_number: str
    user_role: UserRole
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class PlatformStats(BaseModel):
    users_by_role: dict[str, int]
    orders_by_status: dict[str, int]
    total_restaurants: int
