from http import HTTPStatus

from shared.exceptions import AccessDeniedException, BadRequestException, RuleException
from shared.exceptions.existence import NotFoundException


class VendorAlreadyExistsException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "VENDOR_ALREADY_EXISTS"
    detail: str = "User already has a vendor profile"


class VendorProfileNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "VENDOR_PROFILE_NOT_FOUND"
    detail: str = "Vendor profile not found"


class VendorUserNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "USER_NOT_FOUND"
    detail: str = "User not found"


class VendorAccessDeniedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "VENDOR_ACCESS_DENIED"
    detail: str = "Insufficient permissions to access vendor profile"


class VendorNotApprovedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "VENDOR_PROFILE_NOT_APPROVED"
    detail: str = "Vendor profile is not approved"


class UnknownOrderStatusException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "UNKNOWN_ORDER_STATUS"
    detail: str = "Unknown order status: {status}"
