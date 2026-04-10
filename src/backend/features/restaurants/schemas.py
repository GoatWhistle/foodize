import uuid

from pydantic import BaseModel


class RestaurantCreate(BaseModel):
    name: str
    address: str


class RestaurantResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str
    vendor_id: uuid.UUID


class RestaurantUpdate(BaseModel):
    name: str = None
    address: str = None
