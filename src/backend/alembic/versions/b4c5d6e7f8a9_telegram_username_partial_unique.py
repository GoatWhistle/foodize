"""users telegram_username partial unique index

Revision ID: b4c5d6e7f8a9
Revises: a3b4c5d6e7f8
Create Date: 2026-07-17 00:00:01.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "b4c5d6e7f8a9"
down_revision: str | Sequence[str] | None = "a3b4c5d6e7f8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_INDEX_NAME = "uq_users_telegram_username_active"


def upgrade() -> None:
    op.create_index(
        _INDEX_NAME,
        "users",
        ["telegram_username"],
        unique=True,
        postgresql_where="telegram_username IS NOT NULL",
    )


def downgrade() -> None:
    op.drop_index(_INDEX_NAME, table_name="users")
