import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from database.mixins.name_str import NameStrMixin
from shared.enums.category import Category

if TYPE_CHECKING:
    from features import OrderItem, Restaurant


class MenuItem(Base, IdUuidPkMixin, NameStrMixin, CreatedAtMixin, UpdatedAtMixin):
    description: Mapped[str | None]
    price: Mapped[int]
    category: Mapped[Category] = mapped_column(
        String, default=Category.SHAURMA, server_default="SHAURMA", nullable=True
    )
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id"))
    restaurant: Mapped["Restaurant"] = relationship(back_populates="menu_items")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="menu_item")
