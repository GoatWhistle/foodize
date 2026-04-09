from pydantic import BaseModel
class CreateVendor(BaseModel):
    description: str | None = None
class VendorResponse(BaseModel):
    description: str | None = None
