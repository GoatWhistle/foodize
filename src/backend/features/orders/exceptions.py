from http import HTTPStatus

from shared.exceptions import AppException, NotFoundException, RuleException


class OrderNotFoundException(NotFoundException):
    detail: str = "Order not found"


class OrderAccessDeniedException(RuleException):
    detail: str = "You do not have permission to access this order"


class MenuItemsNotFoundException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    detail: str = "One or more menu items were not found"


class MenuItemRestaurantMismatchException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    detail: str = "One or more menu items do not belong to the specified restaurant"


class OrderNotCancellableException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    detail: str = "Order can only be cancelled when in PENDING status"


class InvalidStatusTransitionException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    detail: str = "Invalid order status transition"
