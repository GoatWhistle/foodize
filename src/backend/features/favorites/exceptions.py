from http import HTTPStatus

from shared.exceptions.base import AppException


class AlreadyFavoritedException(AppException):
    status_code = HTTPStatus.CONFLICT
    code = "RESTAURANT_ALREADY_FAVORITED"
    detail = "Restaurant is already in favorites"


class FavoriteNotFoundException(AppException):
    status_code = HTTPStatus.NOT_FOUND
    code = "FAVORITE_NOT_FOUND"
    detail = "Favorite not found"
