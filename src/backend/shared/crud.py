from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.exceptions.existence import NotFoundException


async def get_or_404(session: AsyncSession, model: type, id: Any, detail: str | None = None) -> Any:
    result = await session.execute(select(model).where(model.id == id))
    obj = result.scalars().first()
    if obj is None:
        raise NotFoundException(detail=detail or f"{model.__name__} not found")
    return obj
