from pydantic import BaseModel


class RestaurantCreate(BaseModel):
    name: str
    address: str


class RestaurantResponse(BaseModel):
    id: int
    name: str
    address: str
    vendor_id: int


class RestaurantUpdate(BaseModel):
    name: str = None
    address: str = None
