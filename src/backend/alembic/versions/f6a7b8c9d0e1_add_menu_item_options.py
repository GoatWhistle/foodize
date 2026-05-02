"""add menu item options

Revision ID: f6a7b8c9d0e1
Revises: f25d1a6c969f
Create Date: 2026-04-27 23:30:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, Sequence[str], None] = "f25d1a6c969f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "menu_item_option_groups",
        sa.Column("menu_item_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("selection_type", sa.String(length=16), nullable=False),
        sa.Column("is_required", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("min_selected", sa.Integer(), server_default="0", nullable=False),
        sa.Column("max_selected", sa.Integer(), nullable=True),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_menu_item_option_groups_menu_item_id",
        "menu_item_option_groups",
        ["menu_item_id"],
    )

    op.create_table(
        "menu_item_options",
        sa.Column("group_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("price_delta", sa.Integer(), server_default="0", nullable=False),
        sa.Column("is_available", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["group_id"], ["menu_item_option_groups.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_menu_item_options_group_id", "menu_item_options", ["group_id"])

    op.create_table(
        "order_item_options",
        sa.Column("order_item_id", sa.UUID(), nullable=False),
        sa.Column("option_id", sa.UUID(), nullable=True),
        sa.Column("name_snapshot", sa.String(length=128), nullable=False),
        sa.Column(
            "price_delta_snapshot", sa.Integer(), server_default="0", nullable=False
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["option_id"], ["menu_item_options.id"]),
        sa.ForeignKeyConstraint(["order_item_id"], ["order_items.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_order_item_options_order_item_id", "order_item_options", ["order_item_id"]
    )


def downgrade() -> None:
    op.drop_index(
        "ix_order_item_options_order_item_id", table_name="order_item_options"
    )
    op.drop_table("order_item_options")
    op.drop_index("ix_menu_item_options_group_id", table_name="menu_item_options")
    op.drop_table("menu_item_options")
    op.drop_index(
        "ix_menu_item_option_groups_menu_item_id",
        table_name="menu_item_option_groups",
    )
    op.drop_table("menu_item_option_groups")
