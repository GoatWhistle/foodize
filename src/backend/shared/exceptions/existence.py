from http import HTTPStatus

from shared.exceptions import AppException


class NotFoundException(AppException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "NOT_FOUND"
    detail: str = "Object not found"


class AuthException(AppException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "UNAUTHORIZED"
    detail: str = "Invalid credentials"


class NotAuthenticatedException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "NOT_AUTHENTICATED"
    detail: str = "Not authenticated"


class InvalidCredentialsException(AuthException):
    code: str = "INVALID_CREDENTIALS"
    detail: str = "Invalid phone number or password"


class ModelNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "MODEL_NOT_FOUND"
    detail: str = "{model} not found"


class AlreadyExistsException(AppException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "ALREADY_EXISTS"
    detail: str = "Object already exists"
