import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.restaurants.service import (
    get_all_restaurants_public,
    get_restaurant_public,
)


def _make_row(restaurant_id: uuid.UUID = None, vendor_id: uuid.UUID = None):
    r = MagicMock()
    r.id = restaurant_id or uuid.uuid4()
    r.vendor_id = vendor_id or uuid.uuid4()
    r.name = "Test Cafe"
    r.address = "ул. Тестовая 1"
    r.is_hiring = True
    r.is_open = True
    return [r, 4.5, 10]


class TestGetRestaurantPublic:
    @pytest.mark.asyncio
    async def test_success(self):
        row = _make_row()
        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=row)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await get_restaurant_public(session, row[0].id)
        assert result.id == row[0].id
        assert result.average_rating == 4.5
        assert result.review_count == 10

    @pytest.mark.asyncio
    async def test_not_found(self):
        from features.restaurants.exceptions import RestaurantNotFoundException

        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=None)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(RestaurantNotFoundException):
            await get_restaurant_public(session, uuid.uuid4())


class TestGetAllRestaurantsPublic:
    @pytest.mark.asyncio
    async def test_success_no_filters(self):
        row = _make_row()
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[row])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=1)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, mock_count_result])

        data, total = await get_all_restaurants_public(session)
        assert len(data) == 1
        assert total == 1

    @pytest.mark.asyncio
    async def test_with_name_filter(self):
        row = _make_row()
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[row])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=1)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, mock_count_result])

        data, total = await get_all_restaurants_public(session, name="Cafe")
        assert len(data) == 1

    @pytest.mark.asyncio
    async def test_with_hiring_filter(self):
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=0)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, mock_count_result])

        data, total = await get_all_restaurants_public(
            session, is_hiring=True, is_open=False
        )
        assert data == []
        assert total == 0

    @pytest.mark.asyncio
    async def test_empty_result(self):
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=0)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, mock_count_result])

        data, total = await get_all_restaurants_public(session)
        assert data == []
        assert total == 0
