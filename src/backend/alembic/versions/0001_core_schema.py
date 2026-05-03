"""core schema

Revision ID: 0001_core
Revises:
Create Date: 2026-05-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0001_core"
down_revision: Union[str, Sequence[str], None] = None
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


def deleted_at() -> sa.Column:
    return sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True)


def upgrade() -> None:
    op.create_table(
        "users",
        uuid_pk(),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("phone_number", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=True),
        sa.Column("telegram_id", sa.BigInteger(), nullable=True),
        sa.Column("telegram_username", sa.String(length=64), nullable=True),
        sa.Column("first_name", sa.String(), nullable=True),
        sa.Column("last_name", sa.String(), nullable=True),
        sa.Column("middle_name", sa.String(length=128), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "permissions",
            sa.JSON(),
            server_default=sa.text("'[]'::json"),
            nullable=False,
        ),
        created_at(),
        updated_at(),
        sa.UniqueConstraint("phone_number"),
        sa.UniqueConstraint("telegram_id"),
    )
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_telegram_id", "users", ["telegram_id"], unique=True)

    op.create_table(
        "vendor_profiles",
        uuid_pk(),
        sa.Column("user_id", UUID, nullable=False),
        sa.Column("approval_status", sa.String(), server_default="PENDING", nullable=False),
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
        created_at(),
        updated_at(),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_vendor_profiles_id", "vendor_profiles", ["id"])

    op.create_table(
        "restaurants",
        uuid_pk(),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("description", sa.String(length=1000), nullable=True),
        sa.Column("vendor_id", UUID, nullable=False),
        sa.Column("is_hiring", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_open", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("photo_url", sa.String(length=512), nullable=True),
        sa.Column("moderation_status", sa.String(), server_default="PENDING", nullable=False),
        sa.Column("rejection_reason", sa.String(length=500), nullable=True),
        sa.Column("average_rating", sa.Float(), server_default="0.0", nullable=False),
        sa.Column("review_count", sa.Integer(), server_default="0", nullable=False),
        created_at(),
        updated_at(),
        deleted_at(),
        sa.ForeignKeyConstraint(["vendor_id"], ["vendor_profiles.id"]),
        sa.UniqueConstraint("address"),
    )
    op.create_index("ix_restaurants_id", "restaurants", ["id"])

    op.create_table(
        "staff_profiles",
        uuid_pk(),
        sa.Column("user_id", UUID, nullable=False),
        sa.Column("restaurant_id", UUID, nullable=False),
        sa.Column("role", sa.String(), server_default="COOK", nullable=False),
        created_at(),
        updated_at(),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("ix_staff_profiles_id", "staff_profiles", ["id"])

    op.create_table(
        "menu_items",
        uuid_pk(),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("prep_time_minutes", sa.Integer(), server_default="15", nullable=False),
        sa.Column("category", sa.String(), server_default="SHAURMA", nullable=True),
        sa.Column("is_available", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_deleted", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("photo_url", sa.String(length=512), nullable=True),
        sa.Column("restaurant_id", UUID, nullable=False),
        created_at(),
        updated_at(),
        deleted_at(),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
    )
    op.create_index("ix_menu_items_id", "menu_items", ["id"])

    op.create_table(
        "orders",
        uuid_pk(),
        sa.Column("display_id", sa.Integer(), sa.Identity(always=False), nullable=False),
        sa.Column("user_id", UUID, nullable=False),
        sa.Column("restaurant_id", UUID, nullable=False),
        sa.Column("status", sa.String(), server_default="PENDING", nullable=False),
        sa.Column("total_price", sa.Integer(), nullable=False),
        sa.Column("comment", sa.String(length=500), nullable=True),
        sa.Column("estimated_ready_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ready_at", sa.DateTime(timezone=True), nullable=True),
        created_at(),
        updated_at(),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_orders_id", "orders", ["id"])
    op.create_index("ix_orders_display_id", "orders", ["display_id"], unique=True)

    op.create_table(
        "order_items",
        uuid_pk(),
        sa.Column("order_id", UUID, nullable=False),
        sa.Column("menu_item_id", UUID, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price_at_purchase", sa.Integer(), nullable=False),
        created_at(),
        sa.ForeignKeyConstraint(["menu_item_id"], ["menu_items.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
    )
    op.create_index("ix_order_items_id", "order_items", ["id"])


def downgrade() -> None:
    op.drop_index("ix_order_items_id", table_name="order_items")
    op.drop_table("order_items")
    op.drop_index("ix_orders_display_id", table_name="orders")
    op.drop_index("ix_orders_id", table_name="orders")
    op.drop_table("orders")
    op.drop_index("ix_menu_items_id", table_name="menu_items")
    op.drop_table("menu_items")
    op.drop_index("ix_staff_profiles_id", table_name="staff_profiles")
    op.drop_table("staff_profiles")
    op.drop_index("ix_restaurants_id", table_name="restaurants")
    op.drop_table("restaurants")
    op.drop_index("ix_vendor_profiles_id", table_name="vendor_profiles")
    op.drop_table("vendor_profiles")
    op.drop_index("ix_users_telegram_id", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")
