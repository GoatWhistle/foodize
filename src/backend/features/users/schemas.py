import uuid

from pydantic import BaseModel, ConfigDict, Field

from shared.enums.roles import UserRole


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    phone_number: str = Field(min_length=7, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    user_role: UserRole
    password: str = Field(min_length=8, max_length=128)
    model_config = ConfigDict(from_attributes=True)


class UserRead(UserBase):
    id: uuid.UUID
    user_role: UserRole


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    phone_number: str | None = Field(None, min_length=7, max_length=16, pattern=r"^\+?[0-9]{7,15}$")


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8, max_length=128)
