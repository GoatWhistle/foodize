from unittest.mock import MagicMock

import pytest
from pydantic import ValidationError

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
from features.loyalty.order_integration import basis_value, current_and_next_tier
from features.loyalty.schemas import LoyaltyProgramUpsert, LoyaltyTierInput
from shared.enums.loyalty import LoyaltyProgramType, LoyaltyRewardType, LoyaltyTierBasis


def _tier(threshold: int, percent: int = 5) -> MagicMock:
    tier = MagicMock()
    tier.threshold = threshold
    tier.cashback_percent = percent
    return tier


def test_current_and_next_tier_picks_highest_reached() -> None:
    tiers = [_tier(0), _tier(5), _tier(10)]
    current, upcoming = current_and_next_tier(tiers, 7)
    assert current is tiers[1]
    assert upcoming is tiers[2]


def test_current_and_next_tier_at_top() -> None:
    tiers = [_tier(0), _tier(5)]
    current, upcoming = current_and_next_tier(tiers, 5)
    assert current is tiers[1]
    assert upcoming is None


def test_current_and_next_tier_empty() -> None:
    current, upcoming = current_and_next_tier([], 3)
    assert current is None
    assert upcoming is None


def test_basis_value_orders_and_spent() -> None:
    account = MagicMock()
    account.orders_count = 4
    account.total_spent = 1200
    assert basis_value(account, LoyaltyTierBasis.ORDERS.value) == 4
    assert basis_value(account, LoyaltyTierBasis.SPENT.value) == 1200
    assert basis_value(None, LoyaltyTierBasis.ORDERS.value) == 0


def _punch_data(**overrides: object) -> dict[str, object]:
    data: dict[str, object] = {
        "type": LoyaltyProgramType.PUNCH_CARD,
        "punches_required": 5,
        "reward_type": LoyaltyRewardType.DISCOUNT_FIXED,
        "reward_value": 100,
    }
    data.update(overrides)
    return data


def _assert_raises(data: dict[str, object], expected: type[Exception]) -> None:
    with pytest.raises(ValidationError) as exc_info:
        LoyaltyProgramUpsert.model_validate(data)
    error = exc_info.value.errors()[0]
    assert isinstance(error["ctx"]["error"], expected)


def test_punch_upsert_requires_punches() -> None:
    _assert_raises(_punch_data(punches_required=None), LoyaltyPunchesRequiredMissingError)


def test_punch_upsert_requires_reward_type() -> None:
    _assert_raises(_punch_data(reward_type=None), LoyaltyRewardTypeMissingError)


def test_punch_upsert_free_item_requires_menu_item() -> None:
    _assert_raises(
        _punch_data(reward_type=LoyaltyRewardType.FREE_ITEM, reward_value=None),
        LoyaltyRewardItemRequiredError,
    )


def test_punch_upsert_discount_requires_value() -> None:
    _assert_raises(_punch_data(reward_value=None), LoyaltyRewardValueRequiredError)


def test_punch_upsert_percent_out_of_range() -> None:
    _assert_raises(
        _punch_data(reward_type=LoyaltyRewardType.DISCOUNT_PERCENT, reward_value=150),
        LoyaltyRewardPercentOutOfRangeError,
    )


def test_cashback_upsert_requires_tiers() -> None:
    _assert_raises({"type": LoyaltyProgramType.CASHBACK, "tiers": []}, LoyaltyTiersRequiredError)


def test_cashback_upsert_requires_base_tier() -> None:
    _assert_raises(
        {
            "type": LoyaltyProgramType.CASHBACK,
            "tiers": [LoyaltyTierInput(name="Fan", threshold=3, cashback_percent=5)],
        },
        LoyaltyBaseTierRequiredError,
    )


def test_cashback_upsert_rejects_duplicate_thresholds() -> None:
    _assert_raises(
        {
            "type": LoyaltyProgramType.CASHBACK,
            "tiers": [
                LoyaltyTierInput(name="A", threshold=0, cashback_percent=5),
                LoyaltyTierInput(name="B", threshold=0, cashback_percent=7),
            ],
        },
        LoyaltyTierThresholdsDuplicateError,
    )
