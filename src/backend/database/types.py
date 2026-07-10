import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql import ColumnElement
from sqlalchemy.sql.expression import ColumnClause
from sqlalchemy.types import Boolean, TypeDecorator


class JSONB(TypeDecorator):
    impl = sa.JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.JSONB())
        return dialect.type_descriptor(sa.JSON())


class _JsonArrayContainsString(ColumnClause):
    inherit_cache = True
    type = Boolean()

    def __init__(self, column: ColumnElement, value: str) -> None:
        self.column = column
        self.value = value
        super().__init__("json_array_contains_string")


@compiles(_JsonArrayContainsString, "postgresql")
def _compile_pg(element, compiler, **kw):
    expr = sa.type_coerce(element.column, postgresql.JSONB).contains([element.value])
    return compiler.process(expr, **kw)


@compiles(_JsonArrayContainsString)
def _compile_default(element, compiler, **kw):
    expr = sa.cast(element.column, sa.String).like(f'%"{element.value}"%')
    return compiler.process(expr, **kw)


def json_array_contains_string(column: ColumnElement, value: str) -> ColumnElement:
    return _JsonArrayContainsString(column, value)
