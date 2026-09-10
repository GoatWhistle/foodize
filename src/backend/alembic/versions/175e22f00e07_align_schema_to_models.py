"""align json columns to jsonb and menu category not null

Revision ID: 175e22f00e07
Revises: f8a9b0c1d2e3
Create Date: 2026-09-10 07:30:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "175e22f00e07"
down_revision: str | Sequence[str] | None = "f8a9b0c1d2e3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_JSON_COLUMNS: tuple[tuple[str, str], ...] = (
    ("idempotency_keys", "response_json"),
    ("order_events", "actor_permissions"),
    ("outbox_events", "payload"),
)


def upgrade() -> None:
    """Upgrade schema."""
    for table, column in _JSON_COLUMNS:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN {column} TYPE JSONB USING {column}::jsonb")
    op.execute("UPDATE menu_items SET category = 'SHAURMA' WHERE category IS NULL")
    op.alter_column(
        "menu_items",
        "category",
        existing_type=sa.VARCHAR(),
        nullable=False,
        existing_server_default=sa.text("'SHAURMA'::character varying"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "menu_items",
        "category",
        existing_type=sa.VARCHAR(),
        nullable=True,
        existing_server_default=sa.text("'SHAURMA'::character varying"),
    )
    for table, column in _JSON_COLUMNS:
        op.execute(f"ALTER TABLE {table} ALTER COLUMN {column} TYPE JSON USING {column}::json")
