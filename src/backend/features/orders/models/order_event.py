import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import JSONB, Base, CreatedAtMixin, IdUuidPkMixin

if TYPE_CHECKING:
    from features.orders.models.order import Order


class OrderEvent(Base, IdUuidPkMixin, CreatedAtMixin):
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    actor_permissions: Mapped[list[str]] = mapped_column(JSONB, default=list)
    old_status: Mapped[str] = mapped_column(String)
    new_status: Mapped[str] = mapped_column(String)

    order: Mapped["Order"] = relationship(back_populates="events")
