from pydantic import BaseModel, JsonValue


class ErrorDescriptionSchema(BaseModel):
    error: str
    code: str = "APP_ERROR"
    params: dict[str, JsonValue] = {}


class ErrorSchema(BaseModel):
    detail: ErrorDescriptionSchema
