from typing import Any, cast

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.interfaces import Dialect
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import InstrumentedAttribute
from sqlalchemy.sql import ColumnElement
from sqlalchemy.sql.expression import ColumnClause
from sqlalchemy.types import Boolean, TypeDecorator, TypeEngine


class JSONB(TypeDecorator[Any]):
    impl = sa.JSON
    cache_ok = True

    def load_dialect_impl(self, dialect: Dialect) -> TypeEngine[Any]:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.JSONB())
        return dialect.type_descriptor(sa.JSON())


class _JsonArrayContainsString(ColumnClause[bool]):
    inherit_cache = True
    type = Boolean()

    def __init__(self, column: ColumnElement[Any], value: str) -> None:
        self.column = column
        self.value = value
        super().__init__("json_array_contains_string")


@compiles(_JsonArrayContainsString, "postgresql")
def _compile_pg(element: _JsonArrayContainsString, compiler: Any, **kw: Any) -> str:
    expr = sa.type_coerce(element.column, postgresql.JSONB).contains([element.value])
    return cast("str", compiler.process(expr, **kw))


@compiles(_JsonArrayContainsString)
def _compile_default(element: _JsonArrayContainsString, compiler: Any, **kw: Any) -> str:
    expr = sa.cast(element.column, sa.String).like(f'%"{element.value}"%')
    return cast("str", compiler.process(expr, **kw))


def json_array_contains_string(
    column: ColumnElement[Any] | InstrumentedAttribute[Any], value: str
) -> ColumnElement[bool]:
    return _JsonArrayContainsString(cast("ColumnElement[Any]", column), value)
