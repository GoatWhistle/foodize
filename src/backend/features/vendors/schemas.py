import uuid

from pydantic import BaseModel, ConfigDict


class VendorCreate(BaseModel):
    pass


class VendorResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    approval_status: str = "PENDING"
    rejection_reason: str | None = None

    model_config = ConfigDict(from_attributes=True)
