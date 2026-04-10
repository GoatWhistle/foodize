import uuid

from pydantic import BaseModel

from shared.enums.staff_request_status import StaffRequestStatus


class StaffRequestCreate(BaseModel):
    message: str | None = None


class StaffRequestStatusUpdate(BaseModel):
    status: StaffRequestStatus


class StaffRequestResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    restaurant_id: uuid.UUID
    message: str | None
    status: StaffRequestStatus

    class Config:
        from_attributes = True
