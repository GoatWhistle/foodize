from typing import TYPE_CHECKING

from sqlalchemy import Enum
from sqlalchemy.orm import mapped_column, Mapped, relationship

from database import IdIntPkMixin, Base
from database.mixins.name_str import NameStrMixin
from shared.enums.roles import UserRole

if TYPE_CHECKING:
    from ..orders.models.order import Order


class User(Base, IdIntPkMixin, NameStrMixin):
    phone_number: Mapped[str] = mapped_column(unique=True)
    user_role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        server_default=UserRole.CUSTOMER.value
    )

    vendor_profile: Mapped["VendorProfile | None"] = relationship(back_populates="user")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")