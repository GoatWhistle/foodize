from typing import Any

from pydantic import BaseModel


class ErrorDescriptionSchema(BaseModel):
    error: str
    code: str = "APP_ERROR"
    params: dict[str, Any] = {}


class ErrorSchema(BaseModel):
    detail: ErrorDescriptionSchema
