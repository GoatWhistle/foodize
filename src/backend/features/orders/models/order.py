from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base, IdIntPkMixin

if TYPE_CHECKING:
    from backend.features.users.models import User
    from backend.features.restaurants.models import Restaurant
    from .orders_item import OrderItem

class Order(Base, IdIntPkMixin):
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    restaurant_id: Mapped[int] = mapped_column(ForeignKey("restaurants.id"))
    status: Mapped[str] = mapped_column(server_default="pending")
    total_price: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="orders")
    restaurant: Mapped["Restaurant"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")