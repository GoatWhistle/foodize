import uuid
from typing import Protocol, runtime_checkable

from sqlalchemy import ColumnElement, Delete, Update, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.mixins import IdIntPkMixin, IdUuidPkMixin
from shared.exceptions.existence import ModelNotFoundException

type EntityId = uuid.UUID | int
type IdentifiedModel = IdUuidPkMixin | IdIntPkMixin


@runtime_checkable
class SupportsRowcount(Protocol):
    @property
    def rowcount(self) -> int: ...


def id_matches(model: type[IdentifiedModel], id: EntityId) -> ColumnElement[bool]:
    return model.id == id


async def get_or_404[T: (IdUuidPkMixin, IdIntPkMixin)](
    session: AsyncSession, model: type[T], id: EntityId, detail: str | None = None
) -> T:
    result = await session.execute(select(model).where(id_matches(model, id)))
    obj = result.scalars().first()
    if obj is None:
        raise ModelNotFoundException(detail=detail, model=model.__name__)
    return obj


async def execute_rowcount(session: AsyncSession, stmt: Update | Delete) -> int:
    result = await session.execute(stmt)
    if not isinstance(result, SupportsRowcount):
        return 0
    return int(result.rowcount or 0)
