import uuid

from pydantic import BaseModel, ConfigDict


class VendorCreate(BaseModel):
    description: str | None = None


class VendorDescriptionUpdate(BaseModel):
    description: str


class VendorResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
