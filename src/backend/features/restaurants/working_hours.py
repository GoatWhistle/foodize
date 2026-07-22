import uuid
from datetime import time
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, Integer, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, IdUuidPkMixin

if TYPE_CHECKING:
    from features.restaurants.models import Restaurant


class WorkingHours(Base, IdUuidPkMixin):
    __table_args__ = (
        UniqueConstraint("restaurant_id", "day_of_week", name="uq_working_hours_restaurant_day"),
        CheckConstraint("day_of_week BETWEEN 0 AND 6", name="ck_working_hours_day_of_week"),
        CheckConstraint("is_closed OR open_time <> close_time", name="ck_working_hours_open_close"),
    )

    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False
    )
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    open_time: Mapped[time] = mapped_column(Time, nullable=False)
    close_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_closed: Mapped[bool] = mapped_column(default=False, server_default="false")

    restaurant: Mapped["Restaurant"] = relationship(back_populates="working_hours")
