import sqlalchemy as sa
from pydantic import JsonValue
from sqlalchemy.dialects import postgresql
from sqlalchemy.engine.interfaces import Dialect
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql import ColumnElement
from sqlalchemy.sql.compiler import SQLCompiler
from sqlalchemy.sql.expression import ColumnClause, SQLColumnExpression
from sqlalchemy.types import Boolean, TypeDecorator, TypeEngine

type JsonPayload = dict[str, JsonValue] | list[JsonValue]


class JSONB(TypeDecorator[JsonPayload]):
    impl = sa.JSON
    cache_ok = True

    def load_dialect_impl(self, dialect: Dialect) -> TypeEngine[JsonPayload]:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.JSONB())
        return dialect.type_descriptor(sa.JSON())


class _JsonArrayContainsString[ValueT](ColumnClause[bool]):
    inherit_cache = True
    type = Boolean()

    def __init__(self, column: SQLColumnExpression[ValueT], value: str) -> None:
        self.column = column
        self.value = value
        super().__init__("json_array_contains_string")


@compiles(_JsonArrayContainsString, "postgresql")
def _compile_pg(
    element: _JsonArrayContainsString[object], compiler: SQLCompiler, **kw: object
) -> str:
    expr = sa.type_coerce(element.column, postgresql.JSONB).contains([element.value])
    return compiler.process(expr, **kw)


@compiles(_JsonArrayContainsString)
def _compile_default(
    element: _JsonArrayContainsString[object], compiler: SQLCompiler, **kw: object
) -> str:
    expr = sa.cast(element.column, sa.String).like(f'%"{element.value}"%')
    return compiler.process(expr, **kw)


def json_array_contains_string[ValueT](
    column: SQLColumnExpression[ValueT], value: str
) -> ColumnElement[bool]:
    return _JsonArrayContainsString(column, value)
