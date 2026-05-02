"""create tables

Revision ID: f46678e8cada
Revises:
Create Date: 2026-04-09 21:28:52.547134

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "f46678e8cada"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("phone_number", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("user_role", sa.String(), server_default="CUSTOMER", nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
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
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
        sa.UniqueConstraint("phone_number", name=op.f("uq_users_phone_number")),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_table(
        "vendor_profiles",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
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
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_vendor_profiles_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_vendor_profiles")),
        sa.UniqueConstraint("user_id", name=op.f("uq_vendor_profiles_user_id")),
    )
    op.create_index(
        op.f("ix_vendor_profiles_id"), "vendor_profiles", ["id"], unique=False
    )
    op.create_table(
        "restaurants",
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("vendor_id", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["vendor_id"],
            ["vendor_profiles.id"],
            name=op.f("fk_restaurants_vendor_id_vendor_profiles"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_restaurants")),
        sa.UniqueConstraint("address", name=op.f("uq_restaurants_address")),
    )
    op.create_index(op.f("ix_restaurants_id"), "restaurants", ["id"], unique=False)
    op.create_table(
        "menu_items",
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("category", sa.String(), server_default="SHAURMA", nullable=True),
        sa.Column("restaurant_id", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"],
            name=op.f("fk_menu_items_restaurant_id_restaurants"),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_menu_items")),
    )
    op.create_index(op.f("ix_menu_items_id"), "menu_items", ["id"], unique=False)
    op.create_table(
        "orders",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("restaurant_id", sa.UUID(), nullable=False),
        sa.Column("status", sa.String(), server_default="PENDING", nullable=False),
        sa.Column("total_price", sa.Integer(), nullable=False),
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
        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"],
            name=op.f("fk_orders_restaurant_id_restaurants"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_orders_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_orders")),
    )
    op.create_index(op.f("ix_orders_id"), "orders", ["id"], unique=False)
    op.create_table(
        "staff_profiles",
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("restaurant_id", sa.UUID(), nullable=False),
        sa.Column("is_on_shift", sa.Boolean(), server_default="true", nullable=False),
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
        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"],
            name=op.f("fk_staff_profiles_restaurant_id_restaurants"),
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], name=op.f("fk_staff_profiles_user_id_users")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_staff_profiles")),
        sa.UniqueConstraint("user_id", name=op.f("uq_staff_profiles_user_id")),
    )
    op.create_index(
        op.f("ix_staff_profiles_id"), "staff_profiles", ["id"], unique=False
    )
    op.create_table(
        "order_items",
        sa.Column("order_id", sa.UUID(), nullable=False),
        sa.Column("menu_item_id", sa.UUID(), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("price_at_purchase", sa.Integer(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["menu_item_id"],
            ["menu_items.id"],
            name=op.f("fk_order_items_menu_item_id_menu_items"),
        ),
        sa.ForeignKeyConstraint(
            ["order_id"], ["orders.id"], name=op.f("fk_order_items_order_id_orders")
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_order_items")),
    )
    op.create_index(op.f("ix_order_items_id"), "order_items", ["id"], unique=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_order_items_id"), table_name="order_items")
    op.drop_table("order_items")
    op.drop_index(op.f("ix_staff_profiles_id"), table_name="staff_profiles")
    op.drop_table("staff_profiles")
    op.drop_index(op.f("ix_orders_id"), table_name="orders")
    op.drop_table("orders")
    op.drop_index(op.f("ix_menu_items_id"), table_name="menu_items")
    op.drop_table("menu_items")
    op.drop_index(op.f("ix_restaurants_id"), table_name="restaurants")
    op.drop_table("restaurants")
    op.drop_index(op.f("ix_vendor_profiles_id"), table_name="vendor_profiles")
    op.drop_table("vendor_profiles")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")
    # ### end Alembic commands ###
