from http import HTTPStatus

from shared.exceptions import AppException, NotFoundException, RuleException


class OrderNotFoundException(NotFoundException):
    detail: str = "Order not found"


class OrderAccessDeniedException(RuleException):
    detail: str = "You do not have permission to access this order"


class MenuItemsNotFoundException(AppException):
    status_code: int = HTTPStatus.UNPROCESSABLE_ENTITY
    detail: str = "One or more menu items were not found"
