from http import HTTPStatus

from shared.exceptions import AccessDeniedException, RuleException
from shared.exceptions.existence import NotFoundException


class StaffRequestActiveExistsException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "STAFF_REQUEST_ACTIVE_EXISTS"
    detail: str = "You already have a pending request for this restaurant."


class StaffRequestCooldownException(RuleException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "STAFF_REQUEST_COOLDOWN"
    detail: str = "Your previous request was rejected. Please try again after 24 hours."


class AlreadyStaffException(RuleException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "ALREADY_STAFF_MEMBER"
    detail: str = "You are already a staff member at this restaurant."


class RestaurantNotHiringException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "RESTAURANT_NOT_HIRING"
    detail: str = "You are not a hiring restaurant."


class StaffRequestNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "STAFF_REQUEST_NOT_FOUND"
    detail: str = "Staff request not found"


class StaffProfileNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "STAFF_PROFILE_NOT_FOUND"
    detail: str = "Staff profile not found"


class StaffMenuAccessDeniedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "STAFF_MENU_ACCESS_DENIED"
    detail: str = "Not authorized to manage this restaurant's menu"


class StaffRequestAccessDeniedException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "STAFF_REQUEST_ACCESS_DENIED"
    detail: str = "You don't have permission to manage this request"
