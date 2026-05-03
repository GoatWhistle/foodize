"""product schema

Revision ID: 0002_product
Revises: 0001_core
Create Date: 2026-05-03
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision: str = "0002_product"
down_revision: Union[str, Sequence[str], None] = "0001_core"
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
        "staff_requests",
        uuid_pk(),
        sa.Column("user_id", UUID, nullable=False),
        sa.Column("restaurant_id", UUID, nullable=False),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("status", sa.String(), server_default="PENDING", nullable=False),
        created_at(),
        updated_at(),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_staff_requests_id", "staff_requests", ["id"])

    op.create_table(
        "order_events",
        uuid_pk(),
        sa.Column("order_id", UUID, nullable=False),
        sa.Column("actor_id", UUID, nullable=False),
        sa.Column("actor_permissions", sa.JSON(), nullable=False),
        sa.Column("old_status", sa.String(), nullable=False),
        sa.Column("new_status", sa.String(), nullable=False),
        created_at(),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"]),
    )
    op.create_index("ix_order_events_id", "order_events", ["id"])
    op.create_index("ix_order_events_order_id", "order_events", ["order_id"])

    op.create_table(
        "reviews",
        uuid_pk(),
        sa.Column("user_id", UUID, nullable=False),
        sa.Column("restaurant_id", UUID, nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=1000), nullable=True),
        sa.Column("is_verified_purchase", sa.Boolean(), server_default="false", nullable=False),
        created_at(),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )
    op.create_index("ix_reviews_id", "reviews", ["id"])

    op.create_table(
        "favorites",
        uuid_pk(),
        sa.Column("user_id", UUID, nullable=False),
        sa.Column("restaurant_id", UUID, nullable=False),
        created_at(),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("user_id", "restaurant_id", name="uq_favorites_user_restaurant"),
    )
    op.create_index("ix_favorites_id", "favorites", ["id"])

    op.create_table(
        "promos",
        uuid_pk(),
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("discount_type", sa.String(length=16), nullable=False),
        sa.Column("discount_value", sa.Integer(), nullable=False),
        sa.Column("restaurant_id", UUID, nullable=False),
        sa.Column("max_uses", sa.Integer(), nullable=True),
        sa.Column("used_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        created_at(),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_promos_id", "promos", ["id"])
    op.create_index("ix_promos_code", "promos", ["code"], unique=True)

    op.create_table(
        "working_hours",
        uuid_pk(),
        sa.Column("restaurant_id", UUID, nullable=False),
        sa.Column("day_of_week", sa.Integer(), nullable=False),
        sa.Column("open_time", sa.String(length=5), nullable=False),
        sa.Column("close_time", sa.String(length=5), nullable=False),
        sa.Column("is_closed", sa.Boolean(), server_default="false", nullable=False),
        sa.ForeignKeyConstraint(["restaurant_id"], ["restaurants.id"]),
    )
    op.create_index("ix_working_hours_id", "working_hours", ["id"])
    op.create_index("ix_working_hours_restaurant_id", "working_hours", ["restaurant_id"])


def downgrade() -> None:
    op.drop_index("ix_working_hours_restaurant_id", table_name="working_hours")
    op.drop_index("ix_working_hours_id", table_name="working_hours")
    op.drop_table("working_hours")
    op.drop_index("ix_promos_code", table_name="promos")
    op.drop_index("ix_promos_id", table_name="promos")
    op.drop_table("promos")
    op.drop_index("ix_favorites_id", table_name="favorites")
    op.drop_table("favorites")
    op.drop_index("ix_reviews_id", table_name="reviews")
    op.drop_table("reviews")
    op.drop_index("ix_order_events_order_id", table_name="order_events")
    op.drop_index("ix_order_events_id", table_name="order_events")
    op.drop_table("order_events")
    op.drop_index("ix_staff_requests_id", table_name="staff_requests")
    op.drop_table("staff_requests")
