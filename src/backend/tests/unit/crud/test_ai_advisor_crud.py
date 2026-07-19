import uuid
from datetime import date
from typing import Any
from unittest.mock import AsyncMock, MagicMock

from features.ai_advisor.crud import (
    _day_bounds,
    get_bottom_items,
    get_menu_overview,
    get_reviews_summary,
)


class TestDayBounds:
    def test_returns_datetime_bounds(self) -> None:

        start_date = date(2024, 1, 1)
        end_date = date(2024, 1, 31)
        start, end = _day_bounds(start_date, end_date)

        assert start.date() == start_date
        assert end.date() == end_date
        assert start.tzinfo is not None
        assert end.tzinfo is not None

    def test_start_at_midnight(self) -> None:

        start, _ = _day_bounds(date(2024, 6, 1), date(2024, 6, 30))
        assert start.hour == 0
        assert start.minute == 0


def _make_session_with_rows(rows: list[Any]) -> AsyncMock:
    session = AsyncMock()
    result = MagicMock()
    result.all.return_value = rows
    session.execute = AsyncMock(return_value=result)
    return session


def _make_reviews_session(
    totals_row: Any, dist_rows: list[Any], recent_rows: list[Any]
) -> AsyncMock:
    session = AsyncMock()
    totals_result = MagicMock()
    totals_result.one.return_value = totals_row

    dist_result = MagicMock()
    dist_result.all.return_value = dist_rows

    recent_result = MagicMock()
    recent_result.all.return_value = recent_rows

    session.execute = AsyncMock(side_effect=[totals_result, dist_result, recent_result])
    return session


class TestGetBottomItems:
    async def test_empty_result(self) -> None:
        session = _make_session_with_rows([])
        result = await get_bottom_items(
            session,
            vendor_id=uuid.uuid4(),
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
        )
        assert result == []

    async def test_returns_items(self) -> None:
        rows = [("Редкость", "burgers", 300, True, 0)]
        session = _make_session_with_rows(rows)
        result = await get_bottom_items(
            session,
            vendor_id=uuid.uuid4(),
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
        )
        assert len(result) == 1
        assert result[0]["name"] == "Редкость"
        assert result[0]["sold_qty"] == 0

    async def test_with_restaurant_filter(self) -> None:
        session = _make_session_with_rows([])
        rid = uuid.uuid4()
        result = await get_bottom_items(
            session,
            vendor_id=uuid.uuid4(),
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
            restaurant_id=rid,
        )
        assert result == []

    async def test_sold_qty_none_becomes_zero(self) -> None:
        rows = [("Item", "pizza", 200, True, None)]
        session = _make_session_with_rows(rows)
        result = await get_bottom_items(
            session,
            vendor_id=uuid.uuid4(),
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 31),
        )
        assert result[0]["sold_qty"] == 0


class TestGetMenuOverview:
    async def test_empty_result(self) -> None:
        session = _make_session_with_rows([])
        result = await get_menu_overview(session, vendor_id=uuid.uuid4())
        assert result == []

    async def test_returns_items(self) -> None:
        rows = [("Ресторан 1", "Бургер", "burgers", 250, True)]
        session = _make_session_with_rows(rows)
        result = await get_menu_overview(session, vendor_id=uuid.uuid4())
        assert len(result) == 1
        assert result[0]["restaurant"] == "Ресторан 1"
        assert result[0]["name"] == "Бургер"
        assert result[0]["price"] == 250

    async def test_with_restaurant_filter(self) -> None:
        rows = [("R", "Item", "cat", 100, True)]
        session = _make_session_with_rows(rows)
        result = await get_menu_overview(
            session, vendor_id=uuid.uuid4(), restaurant_id=uuid.uuid4()
        )
        assert len(result) == 1


class TestGetReviewsSummary:
    async def test_empty_reviews(self) -> None:
        session = _make_reviews_session(
            totals_row=(0, 0),
            dist_rows=[],
            recent_rows=[],
        )
        result = await get_reviews_summary(session, vendor_id=uuid.uuid4())
        assert result["average_rating"] == 0.0
        assert result["review_count"] == 0
        assert result["distribution"] == {}
        assert result["recent"] == []

    async def test_with_reviews(self) -> None:
        session = _make_reviews_session(
            totals_row=(4.5, 10),
            dist_rows=[(5, 7), (4, 3)],
            recent_rows=[(5, "Отлично!"), (4, "Хорошо")],
        )
        result = await get_reviews_summary(session, vendor_id=uuid.uuid4())
        assert result["average_rating"] == 4.5
        assert result["review_count"] == 10
        assert result["distribution"] == {5: 7, 4: 3}
        assert len(result["recent"]) == 2
        assert result["recent"][0]["text"] == "<<<REVIEW>>>Отлично!<<<END_REVIEW>>>"
        assert "Отлично!" in result["recent"][0]["text"]

    async def test_with_restaurant_filter(self) -> None:
        session = _make_reviews_session(
            totals_row=(3.0, 2),
            dist_rows=[(3, 2)],
            recent_rows=[],
        )
        result = await get_reviews_summary(
            session, vendor_id=uuid.uuid4(), restaurant_id=uuid.uuid4()
        )
        assert result["average_rating"] == 3.0
