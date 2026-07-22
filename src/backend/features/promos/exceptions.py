from http import HTTPStatus

from shared.exceptions import AppException, NotFoundException
from shared.exceptions.validation import FieldValidationError


class PromoNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "PROMO_NOT_FOUND"
    detail: str = "Promo code not found"


class PromoNotActiveException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "PROMO_NOT_ACTIVE"
    detail: str = "Promo code is not active or has expired"


class PromoRestaurantMismatchException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "PROMO_RESTAURANT_MISMATCH"
    detail: str = "Promo code is not valid for this restaurant"


class PromoUsageLimitException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "PROMO_USAGE_LIMIT_REACHED"
    detail: str = "Promo code usage limit has been reached"


class PromoAlreadyExistsException(AppException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "PROMO_ALREADY_EXISTS"
    detail: str = "Promo code already exists"


class PromoFirstOrderOnlyException(AppException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "PROMO_FIRST_ORDER_ONLY"
    detail: str = "This promo code is valid for the first order only"


class PromoMinOrderAmountException(AppException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "PROMO_MIN_ORDER_AMOUNT"
    detail: str = "Order total is below the minimum for this promo code"


class PromoExpiresAtNotFutureError(FieldValidationError):
    code: str = "PROMO_EXPIRES_AT_NOT_FUTURE"
    detail: str = "expires_at must be in the future"


class PromoPercentDiscountOutOfRangeError(FieldValidationError):
    code: str = "PROMO_PERCENT_DISCOUNT_OUT_OF_RANGE"
    detail: str = "discount_value for PERCENT must be between 1 and 100"
