from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class NameStrMixin:
    name: Mapped[str] = mapped_column(String(255))
