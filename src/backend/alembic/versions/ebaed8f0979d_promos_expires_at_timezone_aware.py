"""promos expires_at timezone aware

Revision ID: ebaed8f0979d
Revises: a1b2c3d4e5f6
Create Date: 2026-07-10 13:51:56.442613

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "ebaed8f0979d"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.alter_column(
        "promos",
        "expires_at",
        existing_type=sa.DateTime(),
        type_=sa.DateTime(timezone=True),
        existing_nullable=True,
        postgresql_using="expires_at AT TIME ZONE 'UTC'",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column(
        "promos",
        "expires_at",
        existing_type=sa.DateTime(timezone=True),
        type_=sa.DateTime(),
        existing_nullable=True,
        postgresql_using="expires_at AT TIME ZONE 'UTC'",
    )
