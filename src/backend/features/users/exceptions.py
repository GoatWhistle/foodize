from http import HTTPStatus

from shared.exceptions import RuleException
from shared.exceptions.existence import NotFoundException
from shared.exceptions.validation import FieldValidationError


class UserAlreadyExistsException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "USER_ALREADY_EXISTS"
    detail: str = "User with this phone number already exists"


class UserNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "USER_NOT_FOUND"
    detail: str = "User not found"


class PasswordMissingLetterError(FieldValidationError):
    code: str = "PASSWORD_MISSING_LETTER"
    detail: str = "Password must contain at least one letter"


class PasswordMissingDigitOrSymbolError(FieldValidationError):
    code: str = "PASSWORD_MISSING_DIGIT_OR_SYMBOL"
    detail: str = "Password must contain at least one digit or special character"
