"""admin filters finance moderation

Revision ID: 20260430_01
Revises: f25d1a6c969f, b4c5d6e7f8a9
Create Date: 2026-04-30 20:10:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "20260430_01"
down_revision: Union[str, Sequence[str], None] = ("f25d1a6c969f", "b4c5d6e7f8a9")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "vendor_profiles",
        sa.Column("approval_status", sa.String(), server_default="APPROVED", nullable=False),
    )
    op.add_column(
        "vendor_profiles",
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
    )
    op.add_column(
        "restaurants",
        sa.Column("moderation_status", sa.String(), server_default="APPROVED", nullable=False),
    )
    op.add_column(
        "restaurants",
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("restaurants", "rejection_reason")
    op.drop_column("restaurants", "moderation_status")
    op.drop_column("vendor_profiles", "rejection_reason")
    op.drop_column("vendor_profiles", "approval_status")
