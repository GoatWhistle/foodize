from http import HTTPStatus

from shared.exceptions.existence import NotFoundException


class MediaFileNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "MEDIA_FILE_NOT_FOUND"
    detail: str = "File not found"
