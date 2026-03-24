from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Enum
from sqlalchemy.orm import Mapped, relationship, mapped_column

from database import Base, IdIntPkMixin
from database.mixins.name_str import NameStrMixin
from shared.enums.category import Category


if TYPE_CHECKING:
    from features.restaurants.models import Restaurant
    from features.orders.models.orders_item import OrderItem


class Menu(Base, IdIntPkMixin, NameStrMixin):
    description: Mapped[str | None]
    price: Mapped[int]
    category: Mapped[Category] = mapped_column(
        Enum(Category), default=Category.SHAURMA, nullable=True
    )
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"))
    restaurant: Mapped["Restaurant"] = relationship(back_populates="menu_items")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="menu_item")
