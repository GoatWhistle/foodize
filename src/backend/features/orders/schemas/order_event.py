import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from shared.enums.order_status import OrderStatus


class OrderEventResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    actor_id: uuid.UUID
    actor_role: str
    old_status: OrderStatus
    new_status: OrderStatus
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
