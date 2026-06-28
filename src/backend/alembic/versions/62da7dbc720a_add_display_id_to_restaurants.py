from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "62da7dbc720a"
down_revision: Union[str, Sequence[str], None] = "f6a7b8c9d0e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"], unique=False)
    op.alter_column(
        "idempotency_keys",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=sa.text("now()"),
    )
    op.create_index(op.f("ix_idempotency_keys_id"), "idempotency_keys", ["id"], unique=False)
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
    op.alter_column(
        "outbox_events",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=False,
        existing_server_default=sa.text("now()"),
    )
    op.drop_constraint(op.f("uq_outbox_events_event_id"), "outbox_events", type_="unique")
    op.create_index(op.f("ix_outbox_events_id"), "outbox_events", ["id"], unique=False)
    op.add_column("restaurants", sa.Column("display_id", sa.String(length=12), nullable=True))
    op.create_index(op.f("ix_restaurants_display_id"), "restaurants", ["display_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_restaurants_display_id"), table_name="restaurants")
    op.drop_column("restaurants", "display_id")
    op.drop_index(op.f("ix_outbox_events_id"), table_name="outbox_events")
    op.create_unique_constraint(
        op.f("uq_outbox_events_event_id"),
        "outbox_events",
        ["event_id"],
        postgresql_nulls_not_distinct=False,
    )
    op.alter_column(
        "outbox_events",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=sa.text("now()"),
    )
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_index(op.f("ix_idempotency_keys_id"), table_name="idempotency_keys")
    op.alter_column(
        "idempotency_keys",
        "created_at",
        existing_type=postgresql.TIMESTAMP(timezone=True),
        nullable=True,
        existing_server_default=sa.text("now()"),
    )
    op.drop_index(op.f("ix_audit_logs_id"), table_name="audit_logs")
