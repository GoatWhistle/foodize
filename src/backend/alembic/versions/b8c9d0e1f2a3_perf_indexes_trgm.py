"""performance indexes: menu option FKs, notifications partial, trgm search

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-07-11 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "b8c9d0e1f2a3"
down_revision: str | Sequence[str] | None = "a7b8c9d0e1f2"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    op.create_index(
        "ix_menu_item_option_groups_menu_item_id",
        "menu_item_option_groups",
        ["menu_item_id"],
    )
    op.create_index(
        "ix_menu_item_options_group_id",
        "menu_item_options",
        ["group_id"],
    )
    op.create_index(
        "ix_notifications_user_id_unread",
        "notifications",
        ["user_id"],
        postgresql_where="is_read = false",
    )
    op.create_index(
        "ix_users_name_trgm",
        "users",
        ["name"],
        postgresql_using="gin",
        postgresql_ops={"name": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_users_phone_number_trgm",
        "users",
        ["phone_number"],
        postgresql_using="gin",
        postgresql_ops={"phone_number": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_restaurants_name_trgm",
        "restaurants",
        ["name"],
        postgresql_using="gin",
        postgresql_ops={"name": "gin_trgm_ops"},
    )
    op.create_index(
        "ix_users_permissions_gin",
        "users",
        ["permissions"],
        postgresql_using="gin",
    )


def downgrade() -> None:
    op.drop_index("ix_users_permissions_gin", table_name="users")
    op.drop_index("ix_restaurants_name_trgm", table_name="restaurants")
    op.drop_index("ix_users_phone_number_trgm", table_name="users")
    op.drop_index("ix_users_name_trgm", table_name="users")
    op.drop_index("ix_notifications_user_id_unread", table_name="notifications")
    op.drop_index("ix_menu_item_options_group_id", table_name="menu_item_options")
    op.drop_index(
        "ix_menu_item_option_groups_menu_item_id",
        table_name="menu_item_option_groups",
    )
