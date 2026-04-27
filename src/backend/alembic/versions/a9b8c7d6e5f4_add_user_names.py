"""add first_name and last_name

Revision ID: a9b8c7d6e5f4
Revises: c4d5e6f7a8b9, e5f6a7b8c9d1
Create Date: 2026-04-27 12:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a9b8c7d6e5f4'
down_revision: Union[str, Sequence[str], None] = ('c4d5e6f7a8b9', 'e5f6a7b8c9d1')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('first_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('last_name', sa.String(), nullable=True))
    op.add_column('users', sa.Column('email', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'email')
    op.drop_column('users', 'last_name')
    op.drop_column('users', 'first_name')
