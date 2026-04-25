import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from database.mixins.name_str import NameStrMixin

if TYPE_CHECKING:
    from features.favorites.models import Favorite
    from features.menu.models import MenuItem
    from features.orders.models import Order
    from features.promos.models import Promo
    from features.reviews.models import Review
    from features.staff.models import StaffProfile, StaffRequest
    from features.vendors.models import VendorProfile


class Restaurant(Base, IdUuidPkMixin, NameStrMixin, CreatedAtMixin, UpdatedAtMixin):
    address: Mapped[str] = mapped_column(unique=True)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendor_profiles.id"))
    is_hiring: Mapped[bool] = mapped_column(default=True, server_default="true")
    is_open: Mapped[bool] = mapped_column(default=True, server_default="true")
    vendor: Mapped["VendorProfile"] = relationship(back_populates="restaurants")
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="restaurant")
    orders: Mapped[list["Order"]] = relationship(back_populates="restaurant")
    staff_requests: Mapped[list["StaffRequest"]] = relationship(back_populates="restaurant")
    staff_members: Mapped[list["StaffProfile"]] = relationship(back_populates="restaurant")
    reviews: Mapped[list["Review"]] = relationship(back_populates="restaurant")
    favorited_by: Mapped[list["Favorite"]] = relationship(back_populates="restaurant")
    promos: Mapped[list["Promo"]] = relationship(back_populates="restaurant")
