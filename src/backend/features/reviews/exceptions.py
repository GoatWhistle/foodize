from http import HTTPStatus

from shared.exceptions import RuleException


class ReviewLimitExceededException(RuleException):
    status_code: int = HTTPStatus.CONFLICT
    detail: str = "You can publish up to 5 reviews for one restaurant"


class ReviewNotAllowedException(RuleException):
    detail: str = "You can only review restaurants where you have a completed order"
