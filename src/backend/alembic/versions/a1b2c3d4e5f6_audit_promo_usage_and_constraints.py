"""audit promo usage table and db constraints

Revision ID: a1b2c3d4e5f6
Revises: e70e4ca20f9d
Create Date: 2026-07-10 12:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "a1b2c3d4e5f6"
down_revision: str | Sequence[str] | None = "e70e4ca20f9d"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "promo_usages",
        sa.Column("promo_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["promo_id"],
            ["promos.id"],
            name=op.f("fk_promo_usages_promo_id_promos"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_promo_usages_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_promo_usages")),
        sa.UniqueConstraint("promo_id", "user_id", name="uq_promo_usages_promo_user"),
    )
    op.create_index(op.f("ix_promo_usages_promo_id"), "promo_usages", ["promo_id"], unique=False)
    op.create_index(op.f("ix_promo_usages_user_id"), "promo_usages", ["user_id"], unique=False)

    op.create_check_constraint("total_price_non_negative", "orders", "total_price >= 0")
    op.create_index(
        "ix_orders_restaurant_created", "orders", ["restaurant_id", "created_at"], unique=False
    )
    op.drop_index(
        "ix_orders_restaurant_active",
        table_name="orders",
        postgresql_where=sa.text("status NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')"),
    )
    op.create_index(
        "ix_orders_restaurant_active",
        "orders",
        ["restaurant_id", "status"],
        unique=False,
        postgresql_where=sa.text("status NOT IN ('COMPLETED', 'CANCELLED')"),
    )

    op.drop_constraint("fk_menu_items_restaurant_id_restaurants", "menu_items", type_="foreignkey")
    op.create_foreign_key(
        "fk_menu_items_restaurant_id_restaurants",
        "menu_items",
        "restaurants",
        ["restaurant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint(
        "fk_menu_item_option_groups_menu_item_id_menu_items",
        "menu_item_option_groups",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "fk_menu_item_option_groups_menu_item_id_menu_items",
        "menu_item_option_groups",
        "menu_items",
        ["menu_item_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint(
        "fk_menu_item_options_group_id_menu_item_option_groups",
        "menu_item_options",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "fk_menu_item_options_group_id_menu_item_option_groups",
        "menu_item_options",
        "menu_item_option_groups",
        ["group_id"],
        ["id"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "fk_menu_item_options_group_id_menu_item_option_groups",
        "menu_item_options",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "fk_menu_item_options_group_id_menu_item_option_groups",
        "menu_item_options",
        "menu_item_option_groups",
        ["group_id"],
        ["id"],
    )
    op.drop_constraint(
        "fk_menu_item_option_groups_menu_item_id_menu_items",
        "menu_item_option_groups",
        type_="foreignkey",
    )
    op.create_foreign_key(
        "fk_menu_item_option_groups_menu_item_id_menu_items",
        "menu_item_option_groups",
        "menu_items",
        ["menu_item_id"],
        ["id"],
    )
    op.drop_constraint("fk_menu_items_restaurant_id_restaurants", "menu_items", type_="foreignkey")
    op.create_foreign_key(
        "fk_menu_items_restaurant_id_restaurants",
        "menu_items",
        "restaurants",
        ["restaurant_id"],
        ["id"],
    )

    op.drop_index(
        "ix_orders_restaurant_active",
        table_name="orders",
        postgresql_where=sa.text("status NOT IN ('COMPLETED', 'CANCELLED')"),
    )
    op.create_index(
        "ix_orders_restaurant_active",
        "orders",
        ["restaurant_id", "status"],
        unique=False,
        postgresql_where=sa.text("status NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED')"),
    )
    op.drop_index("ix_orders_restaurant_created", table_name="orders")
    op.drop_constraint(op.f("ck_orders_total_price_non_negative"), "orders", type_="check")

    op.drop_index(op.f("ix_promo_usages_user_id"), table_name="promo_usages")
    op.drop_index(op.f("ix_promo_usages_promo_id"), table_name="promo_usages")
    op.drop_table("promo_usages")
