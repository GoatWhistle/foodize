import uuid

from pydantic import BaseModel, ConfigDict, Field

from shared.enums.roles import UserRole


class UserBase(BaseModel):
    name: str
    phone_number: str
    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    user_role: UserRole
    password: str = Field(min_length=8)
    model_config = ConfigDict(from_attributes=True)


class UserRead(UserBase):
    id: uuid.UUID
