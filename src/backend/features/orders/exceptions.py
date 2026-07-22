from http import HTTPStatus

from features.restaurants.exceptions import RestaurantClosedException
from shared.exceptions import AppException, BadRequestException, NotFoundException, RuleException
from shared.exceptions.rules import AccessDeniedException
from shared.exceptions.validation import FieldValidationError


class OrderNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "ORDER_NOT_FOUND"
    detail: str = "Order not found"


class OrderAccessDeniedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "ORDER_ACCESS_DENIED"
    detail: str = "You do not have permission to access this order"


class OrdersRestaurantAccessDeniedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "ORDERS_RESTAURANT_ACCESS_DENIED"
    detail: str = "Only VENDOR and STAFF can access orders"


class MenuItemsNotFoundException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "ORDER_MENU_ITEMS_NOT_FOUND"
    detail: str = "One or more menu items were not found"


class MenuItemRestaurantMismatchException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "ORDER_MENU_ITEM_RESTAURANT_MISMATCH"
    detail: str = "One or more menu items do not belong to the specified restaurant"


class OrderNotCancellableException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "ORDER_NOT_CANCELLABLE"
    detail: str = "Order can only be cancelled when in PENDING or ACCEPTED status"


class InvalidStatusTransitionException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "ORDER_INVALID_STATUS_TRANSITION"
    detail: str = "Invalid order status transition"


class MenuItemUnavailableException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "ORDER_MENU_ITEM_UNAVAILABLE"
    detail: str = "One or more menu items are not available"


class OrderNotCompletableException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "ORDER_NOT_COMPLETABLE"
    detail: str = "Order can only be completed when in READY status"


class OrderReadyTimeRequiredException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    code: str = "ORDER_READY_TIME_REQUIRED"
    detail: str = "Ready time is required to accept an order"


class OrderingPausedException(RestaurantClosedException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_ORDERING_PAUSED"
    detail: str = "Restaurant is temporarily not accepting orders"


class RestaurantOutsideWorkingHoursException(RestaurantClosedException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_OUTSIDE_WORKING_HOURS"
    detail: str = "Restaurant is currently closed (outside working hours)"


class RestaurantClosedAtPickupTimeException(RestaurantClosedException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_CLOSED_AT_PICKUP_TIME"
    detail: str = "Restaurant is closed at requested pickup time"


class DuplicateOptionsSelectedException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_DUPLICATE_OPTIONS_SELECTED"
    detail: str = "Duplicate options selected"


class DuplicateOptionsSelectedError(FieldValidationError):
    code: str = "ORDER_ITEM_DUPLICATE_OPTIONS_SELECTED"
    detail: str = "Duplicate options selected"


class OptionNotFoundException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_OPTION_NOT_FOUND"
    detail: str = "Selected option not found"


class OptionMenuItemMismatchException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_OPTION_MENU_ITEM_MISMATCH"
    detail: str = "Selected option does not belong to menu item"


class OptionUnavailableException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_OPTION_UNAVAILABLE"
    detail: str = "Selected option is not available"


class NotEnoughOptionsException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_NOT_ENOUGH_OPTIONS"
    detail: str = "Not enough options selected for {group}"


class TooManyOptionsException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_TOO_MANY_OPTIONS"
    detail: str = "Too many options selected for {group}"


class SingleOptionRequiredException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_SINGLE_OPTION_REQUIRED"
    detail: str = "Only one option can be selected for {group}"


class PickupTimeTooSoonException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_PICKUP_TIME_TOO_SOON"
    detail: str = "Pickup time is too soon for the current restaurant load"


class PickupTimeTooFarException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_PICKUP_TIME_TOO_FAR"
    detail: str = "Pickup time must be within {days} days"


class IdempotentRequestInProgressException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_IDEMPOTENT_REQUEST_IN_PROGRESS"
    detail: str = "Idempotent request is still being processed"


class IdempotencyKeyPayloadMismatchException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ORDER_IDEMPOTENCY_KEY_PAYLOAD_MISMATCH"
    detail: str = "Idempotency key was used with different payload"
