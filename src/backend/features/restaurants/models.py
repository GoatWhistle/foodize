from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship

from database import IdIntPkMixin, Base
from database.mixins.name_str import NameStrMixin

if TYPE_CHECKING:
    from ..vendors import VendorProfile
    from ..menu import Menu
    from ..orders.models.order import Order



class Restaurant(Base, IdIntPkMixin, NameStrMixin):
    address: Mapped[str] = mapped_column(unique=True)

    vendor_id: Mapped[int] = mapped_column(ForeignKey("vendor_profiles.id"))
    vendor: Mapped["VendorProfile"] = relationship(back_populates="restaurants")

    menu_items: Mapped[list["Menu"]] = relationship(back_populates="restaurant")
    orders: Mapped[list["Order"]] = relationship(back_populates="restaurant")




