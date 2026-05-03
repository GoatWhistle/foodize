"""menu option schema

Revision ID: 20260503_02
Revises: 0002_product
Create Date: 2026-05-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "20260503_02"
down_revision: Union[str, Sequence[str], None] = "0002_product"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


UUID = postgresql.UUID(as_uuid=True)


def uuid_pk() -> sa.Column:
    return sa.Column("id", UUID, nullable=False, primary_key=True)


def created_at() -> sa.Column:
    return sa.Column(
        "created_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    )


def updated_at() -> sa.Column:
    return sa.Column(
        "updated_at",
        sa.DateTime(timezone=True),
        server_default=sa.text("now()"),
        nullable=False,
    )


def upgrade() -> None:
    op.create_table(
        "menu_item_option_groups",
        uuid_pk(),
        sa.Column("menu_item_id", UUID, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("selection_type", sa.String(length=16), nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("min_selected", sa.Integer(), server_default="0", nullable=False),
        sa.Column("max_selected", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        created_at(),
        updated_at(),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"]),
    )
    op.create_index("ix_menu_item_option_groups_id", "menu_item_option_groups", ["id"])
    op.create_index(
        "ix_menu_item_option_groups_menu_item_id",
        "menu_item_option_groups",
        ["menu_item_id"],
    )

    op.create_table(
        "menu_item_options",
        uuid_pk(),
        sa.Column("group_id", UUID, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("price_delta", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_available", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        created_at(),
        updated_at(),
        sa.ForeignKeyConstraint(["group_id"], ["menu_item_option_groups.id"]),
    )
    op.create_index("ix_menu_item_options_id", "menu_item_options", ["id"])
    op.create_index("ix_menu_item_options_group_id", "menu_item_options", ["group_id"])

    op.create_table(
        "order_item_options",
        uuid_pk(),
        sa.Column("order_item_id", UUID, nullable=False),
        sa.Column("option_id", UUID, nullable=True),
        sa.Column("name_snapshot", sa.String(length=128), nullable=False),
        sa.Column("price_delta_snapshot", sa.Integer(), server_default="0", nullable=False),
        created_at(),
        sa.ForeignKeyConstraint(["option_id"], ["menu_item_options.id"]),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"]),
    )
    op.create_index("ix_order_item_options_id", "order_item_options", ["id"])
    op.create_index(
        "ix_order_item_options_order_item_id",
        "order_item_options",
        ["order_item_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_order_item_options_order_item_id", table_name="order_item_options")
    op.drop_index("ix_order_item_options_id", table_name="order_item_options")
    op.drop_table("order_item_options")
    op.drop_index("ix_menu_item_options_group_id", table_name="menu_item_options")
    op.drop_index("ix_menu_item_options_id", table_name="menu_item_options")
    op.drop_table("menu_item_options")
    op.drop_index(
        "ix_menu_item_option_groups_menu_item_id",
        table_name="menu_item_option_groups",
    )
    op.drop_index("ix_menu_item_option_groups_id", table_name="menu_item_option_groups")
    op.drop_table("menu_item_option_groups")
