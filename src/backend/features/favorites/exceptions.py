from http import HTTPStatus

from shared.exceptions.base import AppException


class AlreadyFavoritedException(AppException):
    status_code = HTTPStatus.CONFLICT
    detail = "Restaurant is already in favorites"


class FavoriteNotFoundException(AppException):
    status_code = HTTPStatus.NOT_FOUND
    detail = "Favorite not found"
