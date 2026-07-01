import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Index, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base, CreatedAtMixin, IdUuidPkMixin
from shared.enums.outbox_status import OutboxStatus


class OutboxEvent(Base, IdUuidPkMixin, CreatedAtMixin):
    __table_args__ = (
        Index(
            "ix_outbox_events_pending_next_attempt",
            "next_attempt_at",
            postgresql_where=text("status = 'PENDING'"),
        ),
    )
    event_id: Mapped[uuid.UUID] = mapped_column(unique=True, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    routing_key: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default=OutboxStatus.PENDING.value,
        server_default=OutboxStatus.PENDING.value,
        nullable=False,
        index=True,
    )
    attempts: Mapped[int] = mapped_column(default=0, server_default="0", nullable=False)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
