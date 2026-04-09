from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, IdIntPkMixin

if TYPE_CHECKING:
    from features.restaurants.models import Restaurant
    from features.users.models import User


class StaffProfile(Base, IdIntPkMixin):
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"))

    is_on_shift: Mapped[bool] = mapped_column(default=True, server_default="true")

    user: Mapped["User"] = relationship(back_populates="staff_profile")
    restaurant: Mapped["Restaurant"] = relationship()
