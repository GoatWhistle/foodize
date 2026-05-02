"""add is_hiring to restaurant

Revision ID: 103d1c17bb7b
Revises: 9b90b58867ed
Create Date: 2026-04-10 16:46:49.314453

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "103d1c17bb7b"
down_revision: Union[str, Sequence[str], None] = "9b90b58867ed"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "restaurants",
        sa.Column("is_hiring", sa.Boolean(), server_default="true", nullable=False),
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("restaurants", "is_hiring")
    # ### end Alembic commands ###
