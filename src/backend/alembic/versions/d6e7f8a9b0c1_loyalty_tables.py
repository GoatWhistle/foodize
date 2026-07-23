"""loyalty programs, tiers, accounts, transactions, rewards

Revision ID: d6e7f8a9b0c1
Revises: c5d6e7f8a9b0
Create Date: 2026-07-22 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

revision: str = "d6e7f8a9b0c1"
down_revision: str | Sequence[str] | None = "c5d6e7f8a9b0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "loyalty_programs",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("restaurant_id", sa.UUID(), nullable=False),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("tier_basis", sa.String(length=16), server_default="ORDERS", nullable=False),
        sa.Column("min_order_amount", sa.Integer(), nullable=True),
        sa.Column("punches_required", sa.Integer(), nullable=True),
        sa.Column("reward_type", sa.String(length=32), nullable=True),
        sa.Column("reward_value", sa.Integer(), nullable=True),
        sa.Column("reward_menu_item_id", sa.UUID(), nullable=True),
        sa.Column("max_redeem_percent", sa.Integer(), nullable=True),
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
        sa.CheckConstraint(
            "type IN ('PUNCH_CARD', 'CASHBACK')",
            name="ck_loyalty_programs_type",
        ),
        sa.CheckConstraint(
            "tier_basis IN ('ORDERS', 'SPENT')",
            name="ck_loyalty_programs_tier_basis",
        ),
        sa.CheckConstraint(
            "reward_type IS NULL OR reward_type IN "
            "('FREE_ITEM', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED')",
            name="ck_loyalty_programs_reward_type",
        ),
        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"],
            name=op.f("fk_loyalty_programs_restaurant_id_restaurants"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reward_menu_item_id"],
            ["menu_items.id"],
            name=op.f("fk_loyalty_programs_reward_menu_item_id_menu_items"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_programs")),
        sa.UniqueConstraint("restaurant_id", name="uq_loyalty_programs_restaurant"),
    )

    op.create_table(
        "loyalty_tiers",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("program_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("threshold", sa.Integer(), nullable=False),
        sa.Column("cashback_percent", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("threshold >= 0", name="ck_loyalty_tiers_threshold"),
        sa.CheckConstraint(
            "cashback_percent >= 0 AND cashback_percent <= 100",
            name="ck_loyalty_tiers_cashback_percent",
        ),
        sa.ForeignKeyConstraint(
            ["program_id"],
            ["loyalty_programs.id"],
            name=op.f("fk_loyalty_tiers_program_id_loyalty_programs"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_tiers")),
        sa.UniqueConstraint("program_id", "threshold", name="uq_loyalty_tiers_program_threshold"),
    )
    op.create_index(
        op.f("ix_loyalty_tiers_program_id"), "loyalty_tiers", ["program_id"], unique=False
    )

    op.create_table(
        "loyalty_accounts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("restaurant_id", sa.UUID(), nullable=False),
        sa.Column("points_balance", sa.Integer(), server_default="0", nullable=False),
        sa.Column("punches_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("orders_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_spent", sa.Integer(), server_default="0", nullable=False),
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
        sa.CheckConstraint("points_balance >= 0", name="ck_loyalty_accounts_points_balance"),
        sa.CheckConstraint("punches_count >= 0", name="ck_loyalty_accounts_punches_count"),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name=op.f("fk_loyalty_accounts_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["restaurant_id"],
            ["restaurants.id"],
            name=op.f("fk_loyalty_accounts_restaurant_id_restaurants"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_accounts")),
        sa.UniqueConstraint("user_id", "restaurant_id", name="uq_loyalty_accounts_user_restaurant"),
    )
    op.create_index(
        "ix_loyalty_accounts_restaurant_id", "loyalty_accounts", ["restaurant_id"], unique=False
    )

    op.create_table(
        "loyalty_transactions",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("account_id", sa.UUID(), nullable=False),
        sa.Column("order_id", sa.UUID(), nullable=True),
        sa.Column("type", sa.String(length=16), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "type IN ('EARN', 'REDEEM', 'REFUND')",
            name="ck_loyalty_transactions_type",
        ),
        sa.CheckConstraint("amount >= 0", name="ck_loyalty_transactions_amount"),
        sa.ForeignKeyConstraint(
            ["account_id"],
            ["loyalty_accounts.id"],
            name=op.f("fk_loyalty_transactions_account_id_loyalty_accounts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["order_id"],
            ["orders.id"],
            name=op.f("fk_loyalty_transactions_order_id_orders"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_transactions")),
    )
    op.create_index(
        op.f("ix_loyalty_transactions_account_id"),
        "loyalty_transactions",
        ["account_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_loyalty_transactions_order_id"),
        "loyalty_transactions",
        ["order_id"],
        unique=False,
    )

    op.create_table(
        "loyalty_rewards",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("account_id", sa.UUID(), nullable=False),
        sa.Column("reward_type", sa.String(length=32), nullable=False),
        sa.Column("reward_value", sa.Integer(), nullable=True),
        sa.Column("reward_menu_item_id", sa.UUID(), nullable=True),
        sa.Column("status", sa.String(length=16), server_default="AVAILABLE", nullable=False),
        sa.Column("used_order_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "reward_type IN ('FREE_ITEM', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED')",
            name="ck_loyalty_rewards_reward_type",
        ),
        sa.CheckConstraint(
            "status IN ('AVAILABLE', 'USED')",
            name="ck_loyalty_rewards_status",
        ),
        sa.ForeignKeyConstraint(
            ["account_id"],
            ["loyalty_accounts.id"],
            name=op.f("fk_loyalty_rewards_account_id_loyalty_accounts"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["reward_menu_item_id"],
            ["menu_items.id"],
            name=op.f("fk_loyalty_rewards_reward_menu_item_id_menu_items"),
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["used_order_id"],
            ["orders.id"],
            name=op.f("fk_loyalty_rewards_used_order_id_orders"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_loyalty_rewards")),
    )
    op.create_index(
        op.f("ix_loyalty_rewards_account_id"), "loyalty_rewards", ["account_id"], unique=False
    )
    op.create_index(
        op.f("ix_loyalty_rewards_used_order_id"),
        "loyalty_rewards",
        ["used_order_id"],
        unique=False,
    )

    op.execute(
        """
        UPDATE users
        SET permissions = permissions || '["loyalty.read"]'::jsonb
        WHERE NOT permissions ? 'loyalty.read'
        """
    )
    op.execute(
        """
        UPDATE users
        SET permissions = permissions || '["loyalty.manage"]'::jsonb
        WHERE permissions ? 'promos.manage' AND NOT permissions ? 'loyalty.manage'
        """
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(
        """
        UPDATE users
        SET permissions = (permissions - 'loyalty.read') - 'loyalty.manage'
        """
    )
    op.drop_index(op.f("ix_loyalty_rewards_used_order_id"), table_name="loyalty_rewards")
    op.drop_index(op.f("ix_loyalty_rewards_account_id"), table_name="loyalty_rewards")
    op.drop_table("loyalty_rewards")
    op.drop_index(op.f("ix_loyalty_transactions_order_id"), table_name="loyalty_transactions")
    op.drop_index(op.f("ix_loyalty_transactions_account_id"), table_name="loyalty_transactions")
    op.drop_table("loyalty_transactions")
    op.drop_index("ix_loyalty_accounts_restaurant_id", table_name="loyalty_accounts")
    op.drop_table("loyalty_accounts")
    op.drop_index(op.f("ix_loyalty_tiers_program_id"), table_name="loyalty_tiers")
    op.drop_table("loyalty_tiers")
    op.drop_table("loyalty_programs")
