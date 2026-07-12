"""drop duplicate pk indexes, add check constraints, order promo link, review unique

Revision ID: d1e2f3a4b5c6
Revises: c4d5e6f70819
Create Date: 2026-07-11 10:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "d1e2f3a4b5c6"
down_revision: str | Sequence[str] | None = "c4d5e6f70819"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


_PK_ID_INDEXES: tuple[tuple[str, str], ...] = (
    ("ix_outbox_events_id", "outbox_events"),
    ("ix_users_id", "users"),
    ("ix_audit_logs_id", "audit_logs"),
    ("ix_notifications_id", "notifications"),
    ("ix_vendor_profiles_id", "vendor_profiles"),
    ("ix_restaurants_id", "restaurants"),
    ("ix_favorites_id", "favorites"),
    ("ix_menu_items_id", "menu_items"),
    ("ix_orders_id", "orders"),
    ("ix_promos_id", "promos"),
    ("ix_reviews_id", "reviews"),
    ("ix_staff_profiles_id", "staff_profiles"),
    ("ix_staff_requests_id", "staff_requests"),
    ("ix_working_hours_id", "working_hours"),
    ("ix_idempotency_keys_id", "idempotency_keys"),
    ("ix_menu_item_option_groups_id", "menu_item_option_groups"),
    ("ix_order_events_id", "order_events"),
    ("ix_order_items_id", "order_items"),
    ("ix_menu_item_options_id", "menu_item_options"),
    ("ix_order_item_options_id", "order_item_options"),
)

_CHECK_CONSTRAINTS: tuple[tuple[str, str, str], ...] = (
    (
        "ck_orders_status",
        "orders",
        "status IN ('PENDING', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED')",
    ),
    ("ck_promos_discount_type", "promos", "discount_type IN ('PERCENT', 'FIXED')"),
    (
        "ck_restaurants_moderation_status",
        "restaurants",
        "moderation_status IN ('PENDING', 'APPROVED', 'REJECTED')",
    ),
    ("ck_staff_profiles_role", "staff_profiles", "role IN ('COOK')"),
    (
        "ck_menu_item_option_groups_selection_type",
        "menu_item_option_groups",
        "selection_type IN ('single', 'multiple')",
    ),
)


def upgrade() -> None:
    """Upgrade schema."""
    for name, table in _PK_ID_INDEXES:
        op.drop_index(name, table_name=table)

    for name, table, condition in _CHECK_CONSTRAINTS:
        op.create_check_constraint(name, table, condition)

    op.add_column(
        "orders",
        sa.Column("promo_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_orders_promo_id_promos",
        "orders",
        "promos",
        ["promo_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_orders_promo_id", "orders", ["promo_id"], unique=False)

    op.create_index(
        "uq_reviews_user_restaurant_active",
        "reviews",
        ["user_id", "restaurant_id"],
        unique=True,
        postgresql_where=sa.text("deleted_at IS NULL"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(
        "uq_reviews_user_restaurant_active",
        table_name="reviews",
        postgresql_where=sa.text("deleted_at IS NULL"),
    )

    op.drop_index("ix_orders_promo_id", table_name="orders")
    op.drop_constraint("fk_orders_promo_id_promos", "orders", type_="foreignkey")
    op.drop_column("orders", "promo_id")

    for name, table, _condition in reversed(_CHECK_CONSTRAINTS):
        op.drop_constraint(name, table, type_="check")

    for name, table in reversed(_PK_ID_INDEXES):
        op.create_index(name, table, ["id"], unique=False)
