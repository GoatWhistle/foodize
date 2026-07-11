import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    String,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from shared.enums.order_status import OrderStatus

if TYPE_CHECKING:
    from features.orders.models.order_event import OrderEvent
    from features.orders.models.order_item import OrderItem
    from features.restaurants.models import Restaurant
    from features.users.models import User


class Order(Base, IdUuidPkMixin, CreatedAtMixin, UpdatedAtMixin):
    __table_args__ = (
        Index("ix_orders_user_id_status", "user_id", "status"),
        Index(
            "ix_orders_restaurant_active",
            "restaurant_id",
            "status",
            postgresql_where=text("status NOT IN ('COMPLETED', 'CANCELLED')"),
        ),
        Index("ix_orders_restaurant_created", "restaurant_id", "created_at"),
        CheckConstraint("total_price >= 0", name="total_price_non_negative"),
        CheckConstraint(
            "status IN ('PENDING', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED')",
            name="ck_orders_status",
        ),
    )
    display_id: Mapped[int] = mapped_column(
        Integer, Identity(always=False), unique=True, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="RESTRICT"))
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="RESTRICT")
    )
    status: Mapped[str] = mapped_column(
        String,
        default=OrderStatus.PENDING.value,
        server_default=OrderStatus.PENDING.value,
        nullable=False,
    )
    total_price: Mapped[int]
    promo_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("promos.id", ondelete="SET NULL"), nullable=True
    )
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(String(500), nullable=True)
    requested_pickup_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    estimated_ready_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    user: Mapped["User"] = relationship(back_populates="orders")
    restaurant: Mapped["Restaurant"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
    events: Mapped[list["OrderEvent"]] = relationship(
        back_populates="order", order_by="OrderEvent.created_at"
    )
