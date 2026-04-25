import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin

if TYPE_CHECKING:
    from features.restaurants.models import Restaurant


class Promo(Base, IdUuidPkMixin, CreatedAtMixin):
    __tablename__ = "promos"

    code: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    discount_type: Mapped[str] = mapped_column(String(16))  # PERCENT | FIXED
    discount_value: Mapped[int]
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    max_uses: Mapped[int | None] = mapped_column(default=None)
    used_count: Mapped[int] = mapped_column(default=0, server_default="0")
    expires_at: Mapped[datetime | None] = mapped_column(default=None)
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")

    restaurant: Mapped["Restaurant"] = relationship(back_populates="promos")
