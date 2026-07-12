"""data layer audit fixes: promo fk index, soft-delete indexes, option_id set null

Revision ID: d2e3f4a5b6c7
Revises: c9d0e1f2a3b4
Create Date: 2026-07-12 00:00:00.000000

"""

from collections.abc import Sequence

from alembic import op

revision: str = "d2e3f4a5b6c7"
down_revision: str | Sequence[str] | None = "c9d0e1f2a3b4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_CONCURRENT_INDEXES: tuple[tuple[str, str, str], ...] = (
    ("ix_promos_restaurant_id", "promos", "restaurant_id"),
    ("ix_restaurants_deleted_at", "restaurants", "deleted_at"),
    ("ix_reviews_deleted_at", "reviews", "deleted_at"),
)

_OPTION_FK = "fk_order_item_options_option_id_menu_item_options"


def upgrade() -> None:
    with op.get_context().autocommit_block():
        for name, table, column in _CONCURRENT_INDEXES:
            op.create_index(
                name,
                table,
                [column],
                unique=False,
                postgresql_concurrently=True,
                if_not_exists=True,
            )

    op.drop_constraint(_OPTION_FK, "order_item_options", type_="foreignkey")
    op.create_foreign_key(
        _OPTION_FK,
        "order_item_options",
        "menu_item_options",
        ["option_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(_OPTION_FK, "order_item_options", type_="foreignkey")
    op.create_foreign_key(
        _OPTION_FK,
        "order_item_options",
        "menu_item_options",
        ["option_id"],
        ["id"],
    )

    with op.get_context().autocommit_block():
        for name, table, _column in reversed(_CONCURRENT_INDEXES):
            op.drop_index(name, table_name=table, postgresql_concurrently=True, if_exists=True)
