from http import HTTPStatus

from shared.exceptions.existence import AuthException


class TokenExpiredException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TOKEN_EXPIRED"
    detail: str = "Token has expired"


class InvalidTokenException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "INVALID_TOKEN"
    detail: str = "Invalid token"


class InvalidTokenTypeException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "INVALID_TOKEN_TYPE"
    detail: str = "Invalid token type"


class TokenRevokedException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TOKEN_REVOKED"
    detail: str = "Token has been invalidated"


class AccountDeactivatedException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "ACCOUNT_DEACTIVATED"
    detail: str = "Account is deactivated"


class RefreshTokenExpiredException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "REFRESH_TOKEN_EXPIRED"
    detail: str = "Refresh token has expired"


class InvalidRefreshTokenException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "INVALID_REFRESH_TOKEN"
    detail: str = "Invalid refresh token"


class RefreshTokenMissingException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "REFRESH_TOKEN_MISSING"
    detail: str = "Refresh token missing"


class RefreshTokenAlreadyUsedException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "REFRESH_TOKEN_ALREADY_USED"
    detail: str = "Refresh token already used"


class SessionExpiredException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "SESSION_EXPIRED"
    detail: str = "Session has expired, please log in again"


class WrongPasswordException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "WRONG_PASSWORD"
    detail: str = "Wrong password"
