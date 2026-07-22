from http import HTTPStatus

from shared.exceptions.existence import NotFoundException
from shared.exceptions.validation import FieldValidationError


class NotificationNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "NOTIFICATION_NOT_FOUND"
    detail: str = "Notification not found"


class WsInvalidTokenTypeError(FieldValidationError):
    code: str = "WS_INVALID_TOKEN_TYPE"
    detail: str = "wrong token type"


class WsTokenSubjectMissingError(FieldValidationError):
    code: str = "WS_TOKEN_SUBJECT_MISSING"
    detail: str = "Token subject is missing"
