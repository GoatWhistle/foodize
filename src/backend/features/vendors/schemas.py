import uuid

from pydantic import BaseModel, ConfigDict, Field


class VendorCreate(BaseModel):
    description: str | None = Field(None, max_length=2000)


class VendorDescriptionUpdate(BaseModel):
    description: str = Field(..., min_length=1, max_length=2000)


class VendorResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    description: str | None = None
    approval_status: str = "PENDING"
    rejection_reason: str | None = None

    model_config = ConfigDict(from_attributes=True)
