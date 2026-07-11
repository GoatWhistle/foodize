"""orders fk restrict and actor set null

Revision ID: c4d5e6f70819
Revises: 05379e9c7397
Create Date: 2026-07-10 15:20:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "c4d5e6f70819"
down_revision: Union[str, Sequence[str], None] = "05379e9c7397"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint("fk_orders_user_id_users", "orders", type_="foreignkey")
    op.create_foreign_key(
        "fk_orders_user_id_users", "orders", "users", ["user_id"], ["id"], ondelete="RESTRICT"
    )
    op.drop_constraint("fk_orders_restaurant_id_restaurants", "orders", type_="foreignkey")
    op.create_foreign_key(
        "fk_orders_restaurant_id_restaurants",
        "orders",
        "restaurants",
        ["restaurant_id"],
        ["id"],
        ondelete="RESTRICT",
    )
    op.alter_column("order_events", "actor_id", existing_type=sa.UUID(), nullable=True)
    op.drop_constraint("fk_order_events_actor_id_users", "order_events", type_="foreignkey")
    op.create_foreign_key(
        "fk_order_events_actor_id_users",
        "order_events",
        "users",
        ["actor_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_order_events_actor_id_users", "order_events", type_="foreignkey")
    op.create_foreign_key(
        "fk_order_events_actor_id_users",
        "order_events",
        "users",
        ["actor_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.alter_column("order_events", "actor_id", existing_type=sa.UUID(), nullable=False)
    op.drop_constraint("fk_orders_restaurant_id_restaurants", "orders", type_="foreignkey")
    op.create_foreign_key(
        "fk_orders_restaurant_id_restaurants",
        "orders",
        "restaurants",
        ["restaurant_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.drop_constraint("fk_orders_user_id_users", "orders", type_="foreignkey")
    op.create_foreign_key(
        "fk_orders_user_id_users", "orders", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
