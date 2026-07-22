import enum
import uuid

from sqlalchemy import JSON, Boolean, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from database import Base, CreatedAtMixin, IdUuidPkMixin

_PARAMS_TYPE = JSON().with_variant(JSONB(), "postgresql")


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
    title_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    message_key: Mapped[str | None] = mapped_column(String(128), nullable=True)
    params: Mapped[dict[str, object]] = mapped_column(
        _PARAMS_TYPE, nullable=False, default=dict, server_default=text("'{}'")
    )
    type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=NotificationType.SYSTEM.value,
        server_default=NotificationType.SYSTEM.value,
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
