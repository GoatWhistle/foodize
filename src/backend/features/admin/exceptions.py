from http import HTTPStatus

from shared.exceptions import RuleException


class AdminAccessDeniedException(RuleException):
    status_code = HTTPStatus.FORBIDDEN
    detail = "Admin access required"


class PermissionAssignmentDeniedException(RuleException):
    status_code = HTTPStatus.FORBIDDEN
    detail = "Not allowed to assign these permissions"
