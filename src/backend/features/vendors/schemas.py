from pydantic import BaseModel

from features import VendorProfile
from features.users.schemas import UserRead


class CreateVendor(BaseModel):
    description: str | None = None

class ReadVendor(UserRead):
    description: str | None = None
