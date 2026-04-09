import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from shared.enums.order_status import OrderStatus

if TYPE_CHECKING:
    from features.menu.models import MenuItem
    from features.restaurants.models import Restaurant
    from features.users.models import User


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


class OrderItem(Base, IdUuidPkMixin, CreatedAtMixin):
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("menus.id"))
    quantity: Mapped[int] = mapped_column(default=1)
    price_at_purchase: Mapped[int]
    order: Mapped["Order"] = relationship(back_populates="items")
    menu_item: Mapped["MenuItem"] = relationship(back_populates="order_items")
