"""Add average_rating and review_count to Restaurant

Revision ID: 55cda515eee9
Revises: d1e2f3a4b5c6
Create Date: 2026-05-02 10:02:29.979770

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "55cda515eee9"
down_revision: Union[str, Sequence[str], None] = "d1e2f3a4b5c6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "restaurants",
        sa.Column("average_rating", sa.Float(), server_default="0.0", nullable=False),
    )
    op.add_column(
        "restaurants",
        sa.Column("review_count", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("restaurants", "review_count")
    op.drop_column("restaurants", "average_rating")
