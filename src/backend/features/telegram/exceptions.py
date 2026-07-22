from http import HTTPStatus

from shared.exceptions import AppException
from shared.exceptions.existence import AuthException
from shared.exceptions.rules import AccessDeniedException


class InvalidTelegramInitDataException(AppException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TELEGRAM_INIT_DATA_INVALID"
    detail: str = "Invalid Telegram initData"


class TelegramInitDataExpiredException(InvalidTelegramInitDataException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TELEGRAM_INIT_DATA_EXPIRED"
    detail: str = "initData expired"


class TelegramInitDataAlreadyUsedException(InvalidTelegramInitDataException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TELEGRAM_INIT_DATA_ALREADY_USED"
    detail: str = "initData already used"


class TelegramUserNotFoundException(InvalidTelegramInitDataException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TELEGRAM_USER_NOT_FOUND"
    detail: str = "User not found"


class MalformedTelegramInitDataException(AppException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "TELEGRAM_INIT_DATA_MALFORMED"
    detail: str = "Malformed Telegram initData"


class TelegramInitDataHashMissingException(MalformedTelegramInitDataException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "TELEGRAM_INIT_DATA_HASH_MISSING"
    detail: str = "Missing hash"


class TelegramInitDataAuthDateMissingException(MalformedTelegramInitDataException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "TELEGRAM_INIT_DATA_AUTH_DATE_MISSING"
    detail: str = "Missing auth_date"


class TelegramInitDataAuthDateInvalidException(MalformedTelegramInitDataException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "TELEGRAM_INIT_DATA_AUTH_DATE_INVALID"
    detail: str = "Invalid auth_date"


class TelegramInitDataUserPayloadInvalidException(MalformedTelegramInitDataException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "TELEGRAM_INIT_DATA_USER_PAYLOAD_INVALID"
    detail: str = "Invalid user payload"


class TelegramInitDataUserIdMissingException(MalformedTelegramInitDataException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "TELEGRAM_INIT_DATA_USER_ID_MISSING"
    detail: str = "Missing user id"


class InvalidBotSecretException(AccessDeniedException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "TELEGRAM_INVALID_BOT_SECRET"
    detail: str = "Invalid bot secret"


class TooManyLoginCodeRequestsException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TELEGRAM_TOO_MANY_CODE_REQUESTS"
    detail: str = "Too many code requests"


class TooManyFailedLoginAttemptsException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TELEGRAM_TOO_MANY_FAILED_ATTEMPTS"
    detail: str = "Too many failed attempts. Try again later."


class InvalidTelegramCodeException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "TELEGRAM_INVALID_CODE"
    detail: str = "Invalid Telegram code"


class PasswordAlreadySetException(AuthException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    code: str = "PASSWORD_ALREADY_SET"
    detail: str = "Password is already set"
