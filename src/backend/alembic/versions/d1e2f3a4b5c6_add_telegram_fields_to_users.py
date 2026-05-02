"""add telegram fields to users

Revision ID: d1e2f3a4b5c6
Revises: a9b8c7d6e5f4
Create Date: 2026-05-01 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "d1e2f3a4b5c6"
down_revision: Union[str, Sequence[str], None] = ("20260430_01", "a9b8c7d6e5f4")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("telegram_id", sa.BigInteger(), nullable=True))
    op.add_column("users", sa.Column("telegram_username", sa.String(64), nullable=True))
    op.create_unique_constraint("uq_users_telegram_id", "users", ["telegram_id"])
    op.create_index("ix_users_telegram_id", "users", ["telegram_id"], unique=True)
    op.alter_column(
        "users", "hashed_password", existing_type=sa.String(), nullable=True
    )


def downgrade() -> None:
    op.alter_column(
        "users", "hashed_password", existing_type=sa.String(), nullable=False
    )
    op.drop_index("ix_users_telegram_id", table_name="users")
    op.drop_constraint("uq_users_telegram_id", "users", type_="unique")
    op.drop_column("users", "telegram_username")
    op.drop_column("users", "telegram_id")
