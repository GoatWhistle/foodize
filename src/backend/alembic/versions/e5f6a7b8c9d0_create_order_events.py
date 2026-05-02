"""create order_events table

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-04-18 14:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "order_events",
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("actor_id", sa.UUID(), nullable=False),
        sa.Column("actor_role", sa.String(), nullable=False),
        sa.Column("old_status", sa.String(), nullable=False),
        sa.Column("new_status", sa.String(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["actor_id"], ["users.id"], name=op.f("fk_order_events_actor_id_users")
        ),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_order_events_order_id_orders")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_events")),
    )
    op.create_index(op.f("ix_order_events_id"), "order_events", ["id"], unique=False)
    op.create_index(
        op.f("ix_order_events_order_id"), "order_events", ["order_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_order_events_order_id"), table_name="order_events")
    op.drop_index(op.f("ix_order_events_id"), table_name="order_events")
    op.drop_table("order_events")
