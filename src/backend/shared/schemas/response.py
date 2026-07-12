from datetime import UTC, datetime
from typing import TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Meta(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class Pagination(BaseModel):
    current_page: int
    per_page: int
    total: int
    total_pages: int
    next: str | None
    previous: str | None


class SuccessResponse[T](BaseModel):
    data: T
    meta: Meta = Field(default_factory=Meta)


class SuccessListResponse[T](BaseModel):
    data: list[T]
    pagination: Pagination
    meta: Meta = Field(default_factory=Meta)
