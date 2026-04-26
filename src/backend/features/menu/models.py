import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, DeletedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from database.mixins.name_str import NameStrMixin
from shared.enums.category import Category

if TYPE_CHECKING:
    from features.orders.models import OrderItem
    from features.restaurants.models import Restaurant


class MenuItem(Base, IdUuidPkMixin, NameStrMixin, CreatedAtMixin, UpdatedAtMixin, DeletedAtMixin):
    description: Mapped[str | None]
    price: Mapped[int]
    prep_time_minutes: Mapped[int] = mapped_column(default=15, server_default="15")
    category: Mapped[str] = mapped_column(
        String, default=Category.SHAURMA.value, server_default="SHAURMA", nullable=True
    )
    is_available: Mapped[bool] = mapped_column(default=True, server_default="true")
    is_deleted: Mapped[bool] = mapped_column(default=False, server_default="false")
    restaurant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("restaurants.id"))
    restaurant: Mapped["Restaurant"] = relationship(back_populates="menu_items")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="menu_item")
