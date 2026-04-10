from http import HTTPStatus

from shared.exceptions import RuleException


class StaffRequestActiveExistsException(RuleException):
    status_code = HTTPStatus.CONFLICT
    detail = "You already have a pending request for this restaurant."


class StaffRequestCooldownException(RuleException):
    status_code = HTTPStatus.FORBIDDEN
    detail = "Your previous request was rejected. Please try again after 24 hours."


class AlreadyStaffException(RuleException):
    status_code = HTTPStatus.BAD_REQUEST
    detail = "You are already a staff member at this restaurant."


class RestaurantNotHiringException(RuleException):
    status_code = HTTPStatus.CONFLICT
    detail = "You are not a hiring restaurant."
