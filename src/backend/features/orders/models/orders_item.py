from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base, IdIntPkMixin

if TYPE_CHECKING:
    from features.orders.models.order import Order
    from features.menu.models import Menu


class OrderItem(Base, IdIntPkMixin):
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"))
    menu_item_id: Mapped[int] = mapped_column(ForeignKey("menus.id"))
    quantity: Mapped[int] = mapped_column(default=1)
    price_at_purchase: Mapped[int]

    order: Mapped["Order"] = relationship(back_populates="items")
    menu_item: Mapped["Menu"] = relationship(back_populates="order_items")
