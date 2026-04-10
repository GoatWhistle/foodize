import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from database.mixins.name_str import NameStrMixin

if TYPE_CHECKING:
    from features import MenuItem, Order, StaffProfile, StaffRequest, VendorProfile


class Restaurant(Base, IdUuidPkMixin, NameStrMixin, CreatedAtMixin, UpdatedAtMixin):
    address: Mapped[str] = mapped_column(unique=True)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendor_profiles.id"))
    is_hiring: Mapped[bool] = mapped_column(default=True, server_default="true")
    vendor: Mapped["VendorProfile"] = relationship(back_populates="restaurants")
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="restaurant")
    orders: Mapped[list["Order"]] = relationship(back_populates="restaurant")
    staff_requests: Mapped[list["StaffRequest"]] = relationship(back_populates="restaurant")
    staff_members: Mapped[list["StaffProfile"]] = relationship(back_populates="restaurant")
