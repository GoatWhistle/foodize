import uuid

from sqlalchemy import CheckConstraint, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base, CreatedAtMixin, IdUuidPkMixin, UpdatedAtMixin
from shared.enums.loyalty import LoyaltyRewardStatus, LoyaltyTierBasis


class LoyaltyProgram(Base, IdUuidPkMixin, CreatedAtMixin, UpdatedAtMixin):
    __table_args__ = (
        UniqueConstraint("restaurant_id", name="uq_loyalty_programs_restaurant"),
        CheckConstraint(
            "type IN ('PUNCH_CARD', 'CASHBACK')",
            name="ck_loyalty_programs_type",
        ),
        CheckConstraint(
            "tier_basis IN ('ORDERS', 'SPENT')",
            name="ck_loyalty_programs_tier_basis",
        ),
        CheckConstraint(
            "reward_type IS NULL OR reward_type IN "
            "('FREE_ITEM', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED')",
            name="ck_loyalty_programs_reward_type",
        ),
    )

    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(String(16))
    is_active: Mapped[bool] = mapped_column(default=True, server_default="true")
    tier_basis: Mapped[str] = mapped_column(
        String(16),
        default=LoyaltyTierBasis.ORDERS.value,
        server_default=LoyaltyTierBasis.ORDERS.value,
    )
    min_order_amount: Mapped[int | None] = mapped_column(default=None)
    punches_required: Mapped[int | None] = mapped_column(default=None)
    reward_type: Mapped[str | None] = mapped_column(String(32), default=None)
    reward_value: Mapped[int | None] = mapped_column(default=None)
    reward_menu_item_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("menu_items.id", ondelete="SET NULL"), default=None
    )
    max_redeem_percent: Mapped[int | None] = mapped_column(default=None)

    tiers: Mapped[list["LoyaltyTier"]] = relationship(
        back_populates="program",
        cascade="all, delete-orphan",
        order_by="LoyaltyTier.threshold",
    )


class LoyaltyTier(Base, IdUuidPkMixin, CreatedAtMixin):
    __table_args__ = (
        UniqueConstraint("program_id", "threshold", name="uq_loyalty_tiers_program_threshold"),
        CheckConstraint("threshold >= 0", name="ck_loyalty_tiers_threshold"),
        CheckConstraint(
            "cashback_percent >= 0 AND cashback_percent <= 100",
            name="ck_loyalty_tiers_cashback_percent",
        ),
    )

    program_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("loyalty_programs.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(64))
    threshold: Mapped[int]
    cashback_percent: Mapped[int]

    program: Mapped["LoyaltyProgram"] = relationship(back_populates="tiers")


class LoyaltyAccount(Base, IdUuidPkMixin, CreatedAtMixin, UpdatedAtMixin):
    __table_args__ = (
        UniqueConstraint("user_id", "restaurant_id", name="uq_loyalty_accounts_user_restaurant"),
        Index("ix_loyalty_accounts_restaurant_id", "restaurant_id"),
        CheckConstraint("points_balance >= 0", name="ck_loyalty_accounts_points_balance"),
        CheckConstraint("punches_count >= 0", name="ck_loyalty_accounts_punches_count"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    restaurant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("restaurants.id", ondelete="CASCADE")
    )
    points_balance: Mapped[int] = mapped_column(default=0, server_default="0")
    punches_count: Mapped[int] = mapped_column(default=0, server_default="0")
    orders_count: Mapped[int] = mapped_column(default=0, server_default="0")
    total_spent: Mapped[int] = mapped_column(default=0, server_default="0")


class LoyaltyTransaction(Base, IdUuidPkMixin, CreatedAtMixin):
    __table_args__ = (
        CheckConstraint(
            "type IN ('EARN', 'REDEEM', 'REFUND')",
            name="ck_loyalty_transactions_type",
        ),
        CheckConstraint("amount >= 0", name="ck_loyalty_transactions_amount"),
    )

    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("loyalty_accounts.id", ondelete="CASCADE"), index=True
    )
    order_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), index=True, default=None
    )
    type: Mapped[str] = mapped_column(String(16))
    amount: Mapped[int]


class LoyaltyReward(Base, IdUuidPkMixin, CreatedAtMixin):
    __table_args__ = (
        CheckConstraint(
            "reward_type IN ('FREE_ITEM', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED')",
            name="ck_loyalty_rewards_reward_type",
        ),
        CheckConstraint(
            "status IN ('AVAILABLE', 'USED')",
            name="ck_loyalty_rewards_status",
        ),
    )

    account_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("loyalty_accounts.id", ondelete="CASCADE"), index=True
    )
    reward_type: Mapped[str] = mapped_column(String(32))
    reward_value: Mapped[int | None] = mapped_column(default=None)
    reward_menu_item_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("menu_items.id", ondelete="SET NULL"), default=None
    )
    status: Mapped[str] = mapped_column(
        String(16),
        default=LoyaltyRewardStatus.AVAILABLE.value,
        server_default=LoyaltyRewardStatus.AVAILABLE.value,
    )
    used_order_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("orders.id", ondelete="SET NULL"), index=True, default=None
    )
