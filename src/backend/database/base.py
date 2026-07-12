from sqlalchemy.orm import DeclarativeBase, declared_attr

from database.metadata import metadata
from utils import pluralize_snake_case


class Base(DeclarativeBase):
    __abstract__ = True
    metadata = metadata

    @declared_attr.directive
    def __tablename__(self) -> str:
        return f"{pluralize_snake_case(self.__name__)}"
