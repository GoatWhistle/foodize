from pydantic import BaseModel, ConfigDict

from shared.enums.roles import UserRole


class UserBase(BaseModel):
    name: str
    phone_number: str
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    pass


class UserCreate(UserBase):
    user_role: UserRole
    password: str
    model_config = ConfigDict(from_attributes=True)


class UserRead(UserBase):
    id: int
