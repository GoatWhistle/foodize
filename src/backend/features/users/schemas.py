from pydantic import BaseModel

from shared.enums.roles import UserRole


class UserBase(BaseModel):
    name: str
    phone_number: str


class UserUpdate(BaseModel):
    pass


class UserCreate(UserBase):
    user_role: UserRole = UserRole.ADMIN


class UserRead(UserCreate):
    pass
