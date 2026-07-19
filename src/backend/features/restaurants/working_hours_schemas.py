import uuid
from datetime import time as dt_time

from pydantic import BaseModel, ConfigDict, Field, field_validator


class WorkingHoursEntry(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    open_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    close_time: str = Field(..., pattern=r"^\d{2}:\d{2}$")
    is_closed: bool = False


class WorkingHoursRead(BaseModel):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    day_of_week: int = Field(..., ge=0, le=6)
    open_time: str
    close_time: str
    is_closed: bool = False
    model_config = ConfigDict(from_attributes=True)

    @field_validator("open_time", "close_time", mode="before")
    @classmethod
    def _format_time(cls, value: str | dt_time) -> str:
        if isinstance(value, dt_time):
            return value.strftime("%H:%M")
        return value


class WorkingHoursBulkSet(BaseModel):
    hours: list[WorkingHoursEntry] = Field(..., min_length=1, max_length=7)
