from http import HTTPStatus

from shared.exceptions import AppException, NotFoundException
from shared.exceptions.validation import FieldValidationError


class LoyaltyProgramNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "LOYALTY_PROGRAM_NOT_FOUND"
    detail: str = "Loyalty program not found"


class LoyaltyProgramInactiveException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "LOYALTY_PROGRAM_INACTIVE"
    detail: str = "Loyalty program is not active for this restaurant"


class LoyaltyProgramTypeMismatchException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "LOYALTY_PROGRAM_TYPE_MISMATCH"
    detail: str = "Loyalty program does not support this operation"


class LoyaltyPointsInsufficientException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "LOYALTY_POINTS_INSUFFICIENT"
    detail: str = "Not enough loyalty points"


class LoyaltyRedeemLimitExceededException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "LOYALTY_REDEEM_LIMIT_EXCEEDED"
    detail: str = "Points amount exceeds the redeemable limit for this order"


class LoyaltyRewardNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "LOYALTY_REWARD_NOT_FOUND"
    detail: str = "Loyalty reward not found"


class LoyaltyRewardNotAvailableException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "LOYALTY_REWARD_NOT_AVAILABLE"
    detail: str = "Loyalty reward has already been used"


class LoyaltyRewardItemMissingException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "LOYALTY_REWARD_ITEM_MISSING"
    detail: str = "Reward menu item is not present in the order"


class LoyaltyRewardItemInvalidException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "LOYALTY_REWARD_ITEM_INVALID"
    detail: str = "Reward menu item does not belong to this restaurant"


class LoyaltyPunchesRequiredMissingError(FieldValidationError):
    code: str = "LOYALTY_PUNCHES_REQUIRED_MISSING"
    detail: str = "punches_required is required for a punch card program"


class LoyaltyRewardTypeMissingError(FieldValidationError):
    code: str = "LOYALTY_REWARD_TYPE_MISSING"
    detail: str = "reward_type is required for a punch card program"


class LoyaltyRewardItemRequiredError(FieldValidationError):
    code: str = "LOYALTY_REWARD_ITEM_REQUIRED"
    detail: str = "reward_menu_item_id is required for a FREE_ITEM reward"


class LoyaltyRewardValueRequiredError(FieldValidationError):
    code: str = "LOYALTY_REWARD_VALUE_REQUIRED"
    detail: str = "reward_value is required for a discount reward"


class LoyaltyRewardPercentOutOfRangeError(FieldValidationError):
    code: str = "LOYALTY_REWARD_PERCENT_OUT_OF_RANGE"
    detail: str = "reward_value for DISCOUNT_PERCENT must be between 1 and 100"


class LoyaltyTiersRequiredError(FieldValidationError):
    code: str = "LOYALTY_TIERS_REQUIRED"
    detail: str = "At least one tier is required for a cashback program"


class LoyaltyBaseTierRequiredError(FieldValidationError):
    code: str = "LOYALTY_BASE_TIER_REQUIRED"
    detail: str = "A cashback program requires a tier with threshold 0"


class LoyaltyTierThresholdsDuplicateError(FieldValidationError):
    code: str = "LOYALTY_TIER_THRESHOLDS_DUPLICATE"
    detail: str = "Tier thresholds must be unique"
