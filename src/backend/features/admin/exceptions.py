from http import HTTPStatus

from shared.exceptions import RuleException


class AdminAccessDeniedException(RuleException):
    status_code = HTTPStatus.FORBIDDEN
    code = "ADMIN_ACCESS_REQUIRED"
    detail = "Admin access required"


class PermissionAssignmentDeniedException(RuleException):
    status_code = HTTPStatus.FORBIDDEN
    code = "PERMISSION_ASSIGNMENT_DENIED"
    detail = "Not allowed to assign these permissions"
