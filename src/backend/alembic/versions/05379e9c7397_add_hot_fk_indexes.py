"""add hot fk indexes

Revision ID: 05379e9c7397
Revises: ebaed8f0979d
Create Date: 2026-07-10 20:34:37.381453

"""

from typing import Sequence, Union

from alembic import op

revision: str = "05379e9c7397"
down_revision: Union[str, Sequence[str], None] = "ebaed8f0979d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_INDEXES: tuple[tuple[str, str, str], ...] = (
    ("ix_menu_items_restaurant_id", "menu_items", "restaurant_id"),
    ("ix_reviews_restaurant_id", "reviews", "restaurant_id"),
    ("ix_order_events_order_id", "order_events", "order_id"),
    ("ix_order_item_options_order_item_id", "order_item_options", "order_item_id"),
    ("ix_restaurants_vendor_id", "restaurants", "vendor_id"),
    ("ix_staff_requests_user_id", "staff_requests", "user_id"),
    ("ix_staff_requests_restaurant_id", "staff_requests", "restaurant_id"),
    ("ix_staff_profiles_restaurant_id", "staff_profiles", "restaurant_id"),
    ("ix_favorites_restaurant_id", "favorites", "restaurant_id"),
    ("ix_audit_logs_actor_id", "audit_logs", "actor_id"),
    ("ix_audit_logs_entity_id", "audit_logs", "entity_id"),
    ("ix_idempotency_keys_order_id", "idempotency_keys", "order_id"),
)


def upgrade() -> None:
    """Upgrade schema."""
    for name, table, column in _INDEXES:
        op.create_index(name, table, [column], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    for name, table, _column in reversed(_INDEXES):
        op.drop_index(name, table_name=table)
