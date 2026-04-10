import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from shared.enums.order_status import OrderStatus

if TYPE_CHECKING:
    from features import OrderItem, Restaurant, User


class Order(Base, IdUuidPkMixin, CreatedAtMixin, UpdatedAtMixin):
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id"))
    status: Mapped[OrderStatus] = mapped_column(
        String, default=OrderStatus.PENDING, server_default="PENDING", nullable=False
    )
    total_price: Mapped[int]
    user: Mapped["User"] = relationship(back_populates="orders")
    restaurant: Mapped["Restaurant"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
