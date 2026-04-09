from pydantic import BaseModel, Field


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"


class UserLogin(BaseModel):
    phone_number: str
    password: str = Field(min_length=8)
