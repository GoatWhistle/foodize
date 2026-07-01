import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.sql import ColumnElement
from sqlalchemy.types import TypeDecorator


class JSONB(TypeDecorator):
    impl = sa.JSON
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(postgresql.JSONB())
        return dialect.type_descriptor(sa.JSON())


def json_array_contains_string(column: ColumnElement, value: str) -> ColumnElement:
    return sa.cast(column, sa.String).like(f'%"{value}"%')
