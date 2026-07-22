from http import HTTPStatus

from shared.exceptions import AppException


class RuleException(AppException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "RULE_VIOLATION"
    detail: str = "Rule violation"


class InactiveObjectException(RuleException):
    code: str = "INACTIVE_OBJECT"
    detail: str = "Operation is not allowed on inactive object"


class AccessDeniedException(RuleException):
    code: str = "ACCESS_DENIED"
    detail: str = "Access denied"


class RateLimitException(AppException):
    status_code: int = HTTPStatus.TOO_MANY_REQUESTS
    code: str = "RATE_LIMIT_EXCEEDED"
    detail: str = "Rate limit exceeded"
