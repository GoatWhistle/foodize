from http import HTTPStatus

from shared.exceptions import BadRequestException, NotFoundException
from shared.exceptions.validation import FieldValidationError


class MenuItemNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "MENU_ITEM_NOT_FOUND"
    detail: str = "Menu item not found"


class OptionGroupNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "OPTION_GROUP_NOT_FOUND"
    detail: str = "Option group not found"


class OptionNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "OPTION_NOT_FOUND"
    detail: str = "Option not found"


class InvalidSelectionLimitsException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "INVALID_SELECTION_LIMITS"
    detail: str = "min_selected cannot be greater than max_selected"


class UnsupportedMenuImageTypeException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "UNSUPPORTED_IMAGE_TYPE"
    detail: str = "Only JPEG, PNG or WebP images are supported"


class InvalidSelectionLimitsError(FieldValidationError):
    code: str = "INVALID_SELECTION_LIMITS"
    detail: str = "min_selected cannot be greater than max_selected"
