"""add order display id

Revision ID: b4c5d6e7f8a9
Revises: f7a8b9c0d1e2
Create Date: 2026-04-30 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "b4c5d6e7f8a9"
down_revision: Union[str, Sequence[str], None] = "f7a8b9c0d1e2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("display_id", sa.Integer(), nullable=True))
    op.execute("CREATE SEQUENCE IF NOT EXISTS orders_display_id_seq")
    op.execute(
        "UPDATE orders "
        "SET display_id = nextval('orders_display_id_seq') "
        "WHERE display_id IS NULL"
    )
    op.execute(
        "SELECT setval("
        "'orders_display_id_seq', "
        "COALESCE((SELECT MAX(display_id) FROM orders), 0) + 1, "
        "false"
        ")"
    )
    op.alter_column(
        "orders",
        "display_id",
        existing_type=sa.Integer(),
        nullable=False,
        server_default=sa.text("nextval('orders_display_id_seq'::regclass)"),
    )
    op.create_index(op.f("ix_orders_display_id"), "orders", ["display_id"], unique=True)


def downgrade() -> None:
    op.drop_index(op.f("ix_orders_display_id"), table_name="orders")
    op.drop_column("orders", "display_id")
    op.execute("DROP SEQUENCE IF EXISTS orders_display_id_seq")
