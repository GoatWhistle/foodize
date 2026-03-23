from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, IdIntPkMixin


if TYPE_CHECKING:
    from ..users import User
    from ..restaurants import Restaurant


class VendorProfile(Base, IdIntPkMixin):
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    description: Mapped[str | None]

    user: Mapped["User"] = relationship(back_populates="vendor_profile")
    restaurants: Mapped[list["Restaurant"]] = relationship(back_populates="vendor")