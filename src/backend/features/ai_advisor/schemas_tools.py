from typing import NotRequired, TypedDict


class BottomItemRow(TypedDict):
    name: str
    category: str
    price: int
    is_available: bool
    sold_qty: int


class MenuOverviewRow(TypedDict):
    restaurant: str
    name: str
    category: str
    price: int
    is_available: bool


class RecentReview(TypedDict):
    rating: int
    text: str


class ReviewsSummary(TypedDict):
    average_rating: float
    review_count: int
    distribution: dict[int, int]
    recent: list[RecentReview]


class LocalizableCategoryRow(TypedDict):
    category: str


class PeriodArgs(TypedDict):
    period_days: NotRequired[int | str | None]
    restaurant_id: NotRequired[str | None]


class RestaurantArgs(TypedDict):
    restaurant_id: NotRequired[str | None]
