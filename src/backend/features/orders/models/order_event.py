import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin
from shared.enums.order_status import OrderStatus

if TYPE_CHECKING:
    from features.orders.models.order import Order


class OrderEvent(Base, IdUuidPkMixin, CreatedAtMixin):
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"))
    actor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    actor_role: Mapped[str] = mapped_column(String)
    old_status: Mapped[OrderStatus] = mapped_column(String)
    new_status: Mapped[OrderStatus] = mapped_column(String)

    order: Mapped["Order"] = relationship(back_populates="events")
