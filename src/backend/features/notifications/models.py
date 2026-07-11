import enum
import uuid

from sqlalchemy import Boolean, ForeignKey, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base, CreatedAtMixin, IdUuidPkMixin


class NotificationType(str, enum.Enum):
    ORDER_STATUS = "ORDER_STATUS"
    SYSTEM = "SYSTEM"


class Notification(Base, IdUuidPkMixin, CreatedAtMixin):
    __table_args__ = (
        Index(
            "ix_notifications_user_id_unread",
            "user_id",
            postgresql_where=text("is_read = false"),
        ),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=NotificationType.SYSTEM.value,
        server_default=NotificationType.SYSTEM.value,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
