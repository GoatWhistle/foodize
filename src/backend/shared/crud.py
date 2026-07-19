from typing import Any, Protocol, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.exceptions.existence import NotFoundException


class _HasId(Protocol):
    id: Any


T = TypeVar("T", bound=_HasId)


async def get_or_404[T: _HasId](
    session: AsyncSession, model: type[T], id: Any, detail: str | None = None
) -> T:
    result = await session.execute(select(model).where(model.id == id))
    obj = result.scalars().first()
    if obj is None:
        raise NotFoundException(detail=detail or f"{model.__name__} not found")
    return obj
