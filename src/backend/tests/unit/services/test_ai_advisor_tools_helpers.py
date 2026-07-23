import uuid
from datetime import UTC, date, datetime

import pytest

from features.ai_advisor.tools import (
    dumps,
    parse_restaurant_id,
    period_range,
)
from infra.llm.base import ToolInputError


class TestDumps:
    def test_ascii(self) -> None:
        result = dumps({"key": "значение"})
        assert "значение" in result

    def test_datetime_default(self) -> None:
        result = dumps({"d": date(2024, 1, 1)})
        assert "2024-01-01" in result

    def test_returns_string(self) -> None:
        assert isinstance(dumps({"a": 1}), str)


class TestPeriodRange:
    def test_default_30_days(self) -> None:
        start, end = period_range({})
        assert (end - start).days == 29

    def test_custom_period(self) -> None:
        start, end = period_range({"period_days": 7})
        assert (end - start).days == 6

    def test_clamp_max_365(self) -> None:
        start, end = period_range({"period_days": 1000})
        assert (end - start).days == 364

    def test_clamp_min_1(self) -> None:
        start, end = period_range({"period_days": 1})
        assert (end - start).days == 0

    def test_invalid_type_fallback(self) -> None:
        start, end = period_range({"period_days": "bad"})
        assert (end - start).days == 29

    def test_none_fallback(self) -> None:
        start, end = period_range({"period_days": None})
        assert (end - start).days == 29

    def test_end_is_today(self) -> None:
        _, end = period_range({})
        today = datetime.now(UTC).date()
        assert end == today


class TestRestaurantId:
    def test_none_when_missing(self) -> None:
        assert parse_restaurant_id({}) is None

    def test_none_when_empty_string(self) -> None:
        assert parse_restaurant_id({"restaurant_id": ""}) is None

    def test_valid_uuid(self) -> None:
        rid = uuid.uuid4()
        result = parse_restaurant_id({"restaurant_id": str(rid)})
        assert result == rid

    def test_invalid_raises(self) -> None:
        with pytest.raises(ToolInputError, match="invalid restaurant_id"):
            parse_restaurant_id({"restaurant_id": "not-a-uuid"})
