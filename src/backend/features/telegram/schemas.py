from pydantic import BaseModel, Field

from features.auth.schemas import TokenResponse


class TelegramCheckRequest(BaseModel):
    init_data: str


class TelegramCheckResponse(BaseModel):
    status: str
    phone_number: str | None = None


class TelegramRegisterRequest(BaseModel):
    init_data: str
    phone_number: str = Field(min_length=7, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    name: str = Field(min_length=1, max_length=128)


class TelegramBotLinkRequest(BaseModel):
    telegram_id: int
    telegram_username: str | None = Field(default=None, max_length=64)
    phone_number: str = Field(min_length=7, max_length=16, pattern=r"^\+?[0-9]{7,15}$")
    name: str = Field(min_length=1, max_length=128)


TelegramAuthResponse = TokenResponse
