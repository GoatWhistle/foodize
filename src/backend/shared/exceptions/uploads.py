from http import HTTPStatus

from shared.exceptions.base import BadRequestException


class UnsupportedFileTypeException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "UPLOAD_UNSUPPORTED_FILE_TYPE"
    detail: str = "Unsupported file type"


class FileTooLargeException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "UPLOAD_FILE_TOO_LARGE"
    detail: str = "File is too large (maximum 5 MB)"


class EmptyFileException(BadRequestException):
    status_code: int = HTTPStatus.BAD_REQUEST
    code: str = "UPLOAD_EMPTY_FILE"
    detail: str = "Empty file"
