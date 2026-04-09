import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
if TYPE_CHECKING:
    from features.restaurants.models import Restaurant
    from features.users.models import User
class StaffProfile(Base, IdUuidPkMixin, CreatedAtMixin, UpdatedAtMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), unique=True)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id"))
    is_on_shift: Mapped[bool] = mapped_column(default=True, server_default="true")
    user: Mapped["User"] = relationship(back_populates="staff_profile")
    restaurant: Mapped["Restaurant"] = relationship()
