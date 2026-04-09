import uuid
from typing import TYPE_CHECKING
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from database.mixins.name_str import NameStrMixin
if TYPE_CHECKING:
    from features.menu.models import MenuItem
    from features.orders.models import Order
    from features.vendors.models import VendorProfile
class Restaurant(Base, IdUuidPkMixin, NameStrMixin, CreatedAtMixin, UpdatedAtMixin):
    address: Mapped[str] = mapped_column(unique=True)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendor_profiles.id"))
    vendor: Mapped["VendorProfile"] = relationship(back_populates="restaurants")
    menu_items: Mapped[list["MenuItem"]] = relationship(back_populates="restaurant")
    orders: Mapped[list["Order"]] = relationship(back_populates="restaurant")
