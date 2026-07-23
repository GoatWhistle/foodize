from enum import Enum


class LoyaltyProgramType(str, Enum):
    PUNCH_CARD = "PUNCH_CARD"
    CASHBACK = "CASHBACK"


class LoyaltyTierBasis(str, Enum):
    ORDERS = "ORDERS"
    SPENT = "SPENT"


class LoyaltyRewardType(str, Enum):
    FREE_ITEM = "FREE_ITEM"
    DISCOUNT_PERCENT = "DISCOUNT_PERCENT"
    DISCOUNT_FIXED = "DISCOUNT_FIXED"


class LoyaltyRewardStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    USED = "USED"


class LoyaltyTransactionType(str, Enum):
    EARN = "EARN"
    REDEEM = "REDEEM"
    REFUND = "REFUND"
