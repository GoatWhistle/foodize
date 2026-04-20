from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from database.mixins.name_str import NameStrMixin
from shared.enums.roles import UserRole

if TYPE_CHECKING:
    from features.favorites.models import Favorite
    from features.orders.models import Order
    from features.reviews.models import Review
    from features.staff.models import StaffProfile, StaffRequest
    from features.vendors.models import VendorProfile


class User(Base, IdUuidPkMixin, NameStrMixin, CreatedAtMixin, UpdatedAtMixin):
    phone_number: Mapped[str] = mapped_column(unique=True)
    hashed_password: Mapped[str]
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true", nullable=False)
    user_role: Mapped[str] = mapped_column(
        String, default=UserRole.CUSTOMER.value, server_default="CUSTOMER", nullable=False
    )
    vendor_profile: Mapped["VendorProfile | None"] = relationship(back_populates="user")
    orders: Mapped[list["Order"]] = relationship(back_populates="user")
    staff_profile: Mapped["StaffProfile | None"] = relationship(back_populates="user")
    staff_requests: Mapped[list["StaffRequest"]] = relationship(back_populates="user")
    reviews: Mapped[list["Review"]] = relationship(back_populates="user")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="user")
