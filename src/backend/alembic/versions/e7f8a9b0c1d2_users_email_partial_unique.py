"""users email partial unique index

Revision ID: e7f8a9b0c1d2
Revises: d1e2f3a4b5c6
Create Date: 2026-07-11 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "e7f8a9b0c1d2"
down_revision: str | Sequence[str] | None = "d1e2f3a4b5c6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_INDEX_NAME = "uq_users_email_active"


def upgrade() -> None:
    op.create_index(
        _INDEX_NAME,
        "users",
        ["email"],
        unique=True,
        postgresql_where="email IS NOT NULL",
    )


def downgrade() -> None:
    op.drop_index(_INDEX_NAME, table_name="users")
