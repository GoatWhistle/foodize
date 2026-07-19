"""working_hours open/close to TIME with checks

Revision ID: a3b4c5d6e7f8
Revises: d2e3f4a5b6c7
Create Date: 2026-07-17 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a3b4c5d6e7f8"
down_revision: str | Sequence[str] | None = "d2e3f4a5b6c7"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.alter_column(
        "working_hours",
        "open_time",
        type_=sa.Time(),
        existing_type=sa.String(length=5),
        postgresql_using="open_time::time",
        existing_nullable=False,
    )
    op.alter_column(
        "working_hours",
        "close_time",
        type_=sa.Time(),
        existing_type=sa.String(length=5),
        postgresql_using="close_time::time",
        existing_nullable=False,
    )
    op.create_check_constraint(
        "ck_working_hours_day_of_week",
        "working_hours",
        "day_of_week BETWEEN 0 AND 6",
    )
    op.create_check_constraint(
        "ck_working_hours_open_close",
        "working_hours",
        "is_closed OR open_time <> close_time",
    )


def downgrade() -> None:
    op.drop_constraint("ck_working_hours_open_close", "working_hours", type_="check")
    op.drop_constraint("ck_working_hours_day_of_week", "working_hours", type_="check")
    op.alter_column(
        "working_hours",
        "close_time",
        type_=sa.String(length=5),
        existing_type=sa.Time(),
        postgresql_using="to_char(close_time, 'HH24:MI')",
        existing_nullable=False,
    )
    op.alter_column(
        "working_hours",
        "open_time",
        type_=sa.String(length=5),
        existing_type=sa.Time(),
        postgresql_using="to_char(open_time, 'HH24:MI')",
        existing_nullable=False,
    )
