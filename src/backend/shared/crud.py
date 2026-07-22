from typing import Any, Protocol, TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.exceptions.existence import ModelNotFoundException


class _HasId(Protocol):
    id: Any


T = TypeVar("T", bound=_HasId)


async def get_or_404[T: _HasId](
    session: AsyncSession, model: type[T], id: Any, detail: str | None = None
) -> T:
    result = await session.execute(select(model).where(model.id == id))
    obj = result.scalars().first()
    if obj is None:
        raise ModelNotFoundException(detail=detail, model=model.__name__)
    return obj
