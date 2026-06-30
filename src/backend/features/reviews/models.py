import uuid
from typing import TYPE_CHECKING

from sqlalchemy import CheckConstraint, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin

if TYPE_CHECKING:
    from features.restaurants.models import Restaurant
    from features.users.models import User

from database import DeletedAtMixin


class Review(Base, IdUuidPkMixin, CreatedAtMixin, UpdatedAtMixin, DeletedAtMixin):
    __table_args__ = (CheckConstraint("rating >= 1 AND rating <= 5", name="ck_review_rating"),)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id", ondelete="CASCADE"))
    rating: Mapped[int]
    text: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    is_verified_purchase: Mapped[bool] = mapped_column(default=False, server_default="false")
    user: Mapped["User"] = relationship(back_populates="reviews")
    restaurant: Mapped["Restaurant"] = relationship(back_populates="reviews")
