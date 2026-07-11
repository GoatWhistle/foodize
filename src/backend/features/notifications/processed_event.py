import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from database import Base, CreatedAtMixin


class ProcessedEvent(Base, CreatedAtMixin):
    event_id: Mapped[uuid.UUID] = mapped_column(primary_key=True)
    routing_key: Mapped[str] = mapped_column(String(100), nullable=False)
