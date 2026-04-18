from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Pagination(BaseModel):
    current_page: int
    per_page: int
    total: int
    total_pages: int
    next: str | None
    previous: str | None


class SuccessListResponse(BaseModel, Generic[T]):
    data: list[T]
    pagination: Pagination
