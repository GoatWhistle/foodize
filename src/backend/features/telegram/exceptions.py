from http import HTTPStatus

from shared.exceptions import AppException


class InvalidTelegramInitDataException(AppException):
    status_code: int = HTTPStatus.UNAUTHORIZED
    detail: str = "Invalid Telegram initData"
