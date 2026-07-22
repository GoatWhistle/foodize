from http import HTTPStatus

from shared.exceptions import AccessDeniedException, AppException, BadRequestException
from shared.exceptions.existence import AlreadyExistsException, NotFoundException


class RestaurantNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "RESTAURANT_NOT_FOUND"
    detail: str = "Restaurant not found"


class RestaurantClosedException(AppException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_CLOSED"
    detail: str = "Restaurant is currently closed"


class RestaurantDisplayIdGenerationException(AlreadyExistsException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_DISPLAY_ID_GENERATION_FAILED"
    detail: str = "Could not generate unique restaurant display id"


class RestaurantAddressOrDisplayIdExistsException(AlreadyExistsException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_ADDRESS_OR_DISPLAY_ID_EXISTS"
    detail: str = "Restaurant with this address or display id already exists"


class RestaurantAddressExistsException(AlreadyExistsException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_ADDRESS_EXISTS"
    detail: str = "Restaurant with this address already exists"


class VendorNotApprovedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "VENDOR_NOT_APPROVED"
    detail: str = "Vendor account is not approved yet"


class RestaurantAccessDeniedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "RESTAURANT_ACCESS_DENIED"
    detail: str = "You do not have rights to manage restaurants for this vendor"


class UnsupportedRestaurantImageTypeException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "UNSUPPORTED_IMAGE_TYPE"
    detail: str = "Only JPEG, PNG or WebP images are supported"
