import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from features.loyalty.exceptions import (
    LoyaltyBaseTierRequiredError,
    LoyaltyPunchesRequiredMissingError,
    LoyaltyRewardItemRequiredError,
    LoyaltyRewardPercentOutOfRangeError,
    LoyaltyRewardTypeMissingError,
    LoyaltyRewardValueRequiredError,
    LoyaltyTiersRequiredError,
    LoyaltyTierThresholdsDuplicateError,
)
from shared.enums.loyalty import (
    LoyaltyProgramType,
    LoyaltyRewardStatus,
    LoyaltyRewardType,
    LoyaltyTierBasis,
)


class LoyaltyTierInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    threshold: int = Field(..., ge=0)
    cashback_percent: int = Field(..., ge=0, le=100)


class LoyaltyProgramUpsert(BaseModel):
    type: LoyaltyProgramType
    is_active: bool = True
    tier_basis: LoyaltyTierBasis = LoyaltyTierBasis.ORDERS
    min_order_amount: int | None = Field(None, ge=0)
    punches_required: int | None = Field(None, ge=1, le=100)
    reward_type: LoyaltyRewardType | None = None
    reward_value: int | None = Field(None, ge=1)
    reward_menu_item_id: uuid.UUID | None = None
    max_redeem_percent: int = Field(100, ge=1, le=100)
    tiers: list[LoyaltyTierInput] = Field(default_factory=list, max_length=10)

    @model_validator(mode="after")
    def validate_punch_card(self) -> "LoyaltyProgramUpsert":
        if self.type != LoyaltyProgramType.PUNCH_CARD:
            return self
        if self.punches_required is None:
            raise LoyaltyPunchesRequiredMissingError()
        if self.reward_type is None:
            raise LoyaltyRewardTypeMissingError()
        if self.reward_type == LoyaltyRewardType.FREE_ITEM and self.reward_menu_item_id is None:
            raise LoyaltyRewardItemRequiredError()
        if self.reward_type != LoyaltyRewardType.FREE_ITEM and self.reward_value is None:
            raise LoyaltyRewardValueRequiredError()
        if self.reward_type == LoyaltyRewardType.DISCOUNT_PERCENT and (
            self.reward_value is None or not 1 <= self.reward_value <= 100
        ):
            raise LoyaltyRewardPercentOutOfRangeError()
        return self

    @model_validator(mode="after")
    def validate_cashback(self) -> "LoyaltyProgramUpsert":
        if self.type != LoyaltyProgramType.CASHBACK:
            return self
        if not self.tiers:
            raise LoyaltyTiersRequiredError()
        thresholds = [tier.threshold for tier in self.tiers]
        if 0 not in thresholds:
            raise LoyaltyBaseTierRequiredError()
        if len(thresholds) != len(set(thresholds)):
            raise LoyaltyTierThresholdsDuplicateError()
        return self


class LoyaltyTierResponse(BaseModel):
    id: uuid.UUID
    name: str
    threshold: int
    cashback_percent: int

    model_config = ConfigDict(from_attributes=True)


class LoyaltyProgramResponse(BaseModel):
    id: uuid.UUID
    restaurant_id: uuid.UUID
    type: LoyaltyProgramType
    is_active: bool
    tier_basis: LoyaltyTierBasis
    min_order_amount: int | None
    punches_required: int | None
    reward_type: LoyaltyRewardType | None
    reward_value: int | None
    reward_menu_item_id: uuid.UUID | None
    max_redeem_percent: int | None
    tiers: list[LoyaltyTierResponse]

    model_config = ConfigDict(from_attributes=True)


class LoyaltyRewardResponse(BaseModel):
    id: uuid.UUID
    reward_type: LoyaltyRewardType
    reward_value: int | None
    reward_menu_item_id: uuid.UUID | None
    status: LoyaltyRewardStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoyaltyStatusResponse(BaseModel):
    program: LoyaltyProgramResponse | None
    points_balance: int
    punches_count: int
    orders_count: int
    total_spent: int
    current_tier: LoyaltyTierResponse | None
    next_tier: LoyaltyTierResponse | None
    rewards: list[LoyaltyRewardResponse]
