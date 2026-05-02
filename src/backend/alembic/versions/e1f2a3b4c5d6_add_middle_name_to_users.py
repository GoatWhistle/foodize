"""add middle_name to users

Revision ID: e1f2a3b4c5d6
Revises: 55cda515eee9
Create Date: 2026-05-02 12:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, Sequence[str], None] = "55cda515eee9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("middle_name", sa.String(128), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "middle_name")
