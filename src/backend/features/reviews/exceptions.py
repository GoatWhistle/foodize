from http import HTTPStatus

from shared.exceptions import NotFoundException, RuleException


class ReviewLimitExceededException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    code: str = "REVIEW_LIMIT_EXCEEDED"
    detail: str = "You have already reviewed this restaurant"


class ReviewNotAllowedException(RuleException):
    status_code: int = HTTPStatus.FORBIDDEN
    code: str = "REVIEW_NOT_ALLOWED"
    detail: str = "You can only review restaurants where you have a completed order"


class ReviewNotFoundException(NotFoundException):
    status_code: int = HTTPStatus.NOT_FOUND
    code: str = "REVIEW_NOT_FOUND"
    detail: str = "Review not found"
