import uuid

from pydantic import BaseModel, ConfigDict


class RestaurantCreate(BaseModel):
    name: str
    address: str


class RestaurantResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str
    vendor_id: uuid.UUID
    is_hiring: bool = True
    is_open: bool = True

    model_config = ConfigDict(from_attributes=True)


class RestaurantUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    is_hiring: bool | None = None
    is_open: bool | None = None
