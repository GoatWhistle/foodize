import re
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from shared.enums.permissions import Permission


def _validate_password_strength(v: str) -> str:
    if not re.search(r"[A-Za-z]", v):
        raise ValueError("Пароль должен содержать хотя бы одну букву")
    if not re.search(r"[0-9!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]", v):
        raise ValueError("Пароль должен содержать хотя бы одну цифру или спецсимвол")
    return v


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=128)
    phone_number: str = Field(min_length=7, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    model_config = ConfigDict(from_attributes=True)


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password_strength(v)


class UserRead(UserBase):
    id: uuid.UUID
    permissions: list[Permission]
    has_password: bool = False
    phone_number: str = Field(min_length=1, max_length=64)
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None
    email: str | None = None
    telegram_id: int | None = None
    telegram_username: str | None = None


class UserPublicRead(BaseModel):
    id: uuid.UUID
    name: str
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=128)
    first_name: str | None = Field(None, min_length=1, max_length=128)
    last_name: str | None = Field(None, min_length=1, max_length=128)
    middle_name: str | None = Field(None, min_length=1, max_length=128)
    email: EmailStr | None = Field(None, max_length=128)
    phone_number: str | None = Field(None, min_length=7, max_length=16, pattern=r"^\+?[0-9]{7,15}$")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str | None) -> str | None:
        return v.strip().lower() if v else v


class ChangePasswordRequest(BaseModel):
    old_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _validate_password_strength(v)
