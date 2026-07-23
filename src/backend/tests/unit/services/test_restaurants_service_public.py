import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.service import get_all_restaurants_public, get_restaurant_public

from .restaurants_service_helpers import empty_working_hours_result, make_restaurant_row


class TestGetRestaurantPublic:
    async def test_success(self) -> None:
        row = make_restaurant_row()
        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=row)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, empty_working_hours_result()])

        result = await get_restaurant_public(session, row[0].id)
        assert result.id == row[0].id
        assert result.orders_count_7d == 10

    async def test_success_by_display_id(self) -> None:
        row = make_restaurant_row()
        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=row)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, empty_working_hours_result()])

        result = await get_restaurant_public(session, "test-cafe")

        assert result.id == row[0].id
        assert result.display_id == "test-cafe"

    async def test_not_found(self) -> None:
        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=None)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(RestaurantNotFoundException):
            await get_restaurant_public(session, uuid.uuid4())


class TestGetAllRestaurantsPublic:
    async def test_success_no_filters(self) -> None:
        row = make_restaurant_row()
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[row])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=1)

        session = AsyncMock()
        session.execute = AsyncMock(
            side_effect=[mock_result, empty_working_hours_result(), mock_count_result]
        )

        data, total = await get_all_restaurants_public(session)
        assert len(data) == 1
        assert total == 1

    async def test_with_name_filter(self) -> None:
        row = make_restaurant_row()
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[row])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=1)

        session = AsyncMock()
        session.execute = AsyncMock(
            side_effect=[mock_result, empty_working_hours_result(), mock_count_result]
        )

        data, total = await get_all_restaurants_public(session, name="Cafe")
        assert len(data) == 1
        assert total == 1

    async def test_with_hiring_filter(self) -> None:
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=0)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, mock_count_result])

        data, total = await get_all_restaurants_public(session, is_hiring=True, is_open=False)
        assert data == []
        assert total == 0

    async def test_empty_result(self) -> None:
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=0)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, mock_count_result])

        data, total = await get_all_restaurants_public(session)
        assert data == []
        assert total == 0
