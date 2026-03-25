from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import mapped_column, Mapped, relationship

from database import IdIntPkMixin, Base
from database.mixins.name_str import NameStrMixin
from shared.enums.roles import UserRole

if TYPE_CHECKING:
    from features.orders.models.order import Order
    from features.vendors.models import VendorProfile


class User(Base, IdIntPkMixin, NameStrMixin):
    phone_number: Mapped[str] = mapped_column(unique=True)
    hashed_password: Mapped[str]
    user_role: Mapped[UserRole] = mapped_column(
        String, default=UserRole.CUSTOMER, server_default="CUSTOMER", nullable=False
    )
    vendor_profile: Mapped["VendorProfile | None"] = relationship(back_populates="user")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")
