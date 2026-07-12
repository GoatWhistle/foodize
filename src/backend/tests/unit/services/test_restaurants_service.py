import uuid
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.restaurants.exceptions import RestaurantNotFoundException
from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate
from features.restaurants.service import (
    create_restaurant_for_vendor,
    get_all_restaurants_public,
    get_my_restaurants,
    get_restaurant_public,
    update_restaurant_for_vendor,
)
from shared.enums.moderation_status import ModerationStatus
from shared.exceptions.rules import AccessDeniedException


def _make_row(
    restaurant_id: uuid.UUID | None = None, vendor_id: uuid.UUID | None = None
) -> list[Any]:
    restaurant = MagicMock()
    restaurant.id = restaurant_id or uuid.uuid4()
    restaurant.vendor_id = vendor_id or uuid.uuid4()
    restaurant.display_id = "test-cafe"
    restaurant.name = "Test Cafe"
    restaurant.address = "Test Street 1"
    restaurant.description = None
    restaurant.photo_url = None
    restaurant.is_hiring = True
    restaurant.is_open = True
    restaurant.moderation_status = ModerationStatus.APPROVED.value
    restaurant.rejection_reason = None
    return [restaurant, 10]


def _empty_working_hours_result() -> MagicMock:
    result = MagicMock()
    result.scalars.return_value.all.return_value = []
    return result


class TestGetRestaurantPublic:
    @pytest.mark.asyncio
    async def test_success(self) -> None:
        row = _make_row()
        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=row)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, _empty_working_hours_result()])

        result = await get_restaurant_public(session, row[0].id)
        assert result.id == row[0].id
        assert result.orders_count_7d == 10

    @pytest.mark.asyncio
    async def test_success_by_display_id(self) -> None:
        row = _make_row()
        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=row)

        session = AsyncMock()
        session.execute = AsyncMock(side_effect=[mock_result, _empty_working_hours_result()])

        result = await get_restaurant_public(session, "test-cafe")

        assert result.id == row[0].id
        assert result.display_id == "test-cafe"

    @pytest.mark.asyncio
    async def test_not_found(self) -> None:
        mock_result = MagicMock()
        mock_result.one_or_none = MagicMock(return_value=None)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(RestaurantNotFoundException):
            await get_restaurant_public(session, uuid.uuid4())


class TestGetAllRestaurantsPublic:
    @pytest.mark.asyncio
    async def test_success_no_filters(self) -> None:
        row = _make_row()
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[row])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=1)

        session = AsyncMock()
        session.execute = AsyncMock(
            side_effect=[mock_result, _empty_working_hours_result(), mock_count_result]
        )

        data, total = await get_all_restaurants_public(session)
        assert len(data) == 1
        assert total == 1

    @pytest.mark.asyncio
    async def test_with_name_filter(self) -> None:
        row = _make_row()
        mock_result = MagicMock()
        mock_result.all = MagicMock(return_value=[row])

        mock_count_result = MagicMock()
        mock_count_result.scalar_one = MagicMock(return_value=1)

        session = AsyncMock()
        session.execute = AsyncMock(
            side_effect=[mock_result, _empty_working_hours_result(), mock_count_result]
        )

        data, total = await get_all_restaurants_public(session, name="Cafe")
        assert len(data) == 1
        assert total == 1

    @pytest.mark.asyncio
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

    @pytest.mark.asyncio
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


class TestCreateRestaurantForVendor:
    @pytest.mark.asyncio
    async def test_vendor_not_found_raises(self) -> None:
        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=None)
        session.execute = AsyncMock(return_value=mock_result)

        data = RestaurantCreate(name="Test", address="Addr", is_open=True, is_hiring=False)
        with pytest.raises(AccessDeniedException):
            await create_restaurant_for_vendor(session, data, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_vendor_not_approved_raises(self) -> None:
        vendor = MagicMock()
        vendor.approval_status = ModerationStatus.PENDING.value

        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=vendor)
        session.execute = AsyncMock(return_value=mock_result)

        data = RestaurantCreate(name="Test", address="Addr", is_open=True, is_hiring=False)
        with pytest.raises(AccessDeniedException):
            await create_restaurant_for_vendor(session, data, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_creates_restaurant_success(self) -> None:
        vendor = MagicMock()
        vendor.approval_status = ModerationStatus.APPROVED.value
        vendor.user.permissions = []

        mock_restaurant = MagicMock()
        mock_restaurant.moderation_status = ModerationStatus.PENDING.value

        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=vendor)
        session.execute = AsyncMock(return_value=mock_result)
        session.commit = AsyncMock()
        session.refresh = AsyncMock()

        data = RestaurantCreate(name="Test", address="Addr", is_open=True, is_hiring=False)

        with (
            patch(
                "features.restaurants.service.crud.create_restaurant",
                new_callable=AsyncMock,
                return_value=mock_restaurant,
            ),
            patch(
                "features.restaurants.schemas.RestaurantResponse.model_validate",
                return_value=MagicMock(),
            ),
        ):
            result = await create_restaurant_for_vendor(session, data, uuid.uuid4())
        assert result is not None


class TestUpdateRestaurantForVendor:
    @pytest.mark.asyncio
    async def test_success(self) -> None:
        restaurant = MagicMock()
        updated = MagicMock()

        session = AsyncMock()
        session.commit = AsyncMock()

        data = RestaurantUpdate(name="New Name")

        with (
            patch(
                "features.restaurants.service.get_restaurant_and_check_ownership",
                new_callable=AsyncMock,
                return_value=restaurant,
            ),
            patch(
                "features.restaurants.service.crud.update_restaurant",
                new_callable=AsyncMock,
                return_value=updated,
            ),
            patch(
                "features.restaurants.schemas.RestaurantResponse.model_validate",
                return_value=MagicMock(),
            ),
        ):
            result = await update_restaurant_for_vendor(session, uuid.uuid4(), data, uuid.uuid4())
        assert result is not None


class TestGetMyRestaurants:
    @pytest.mark.asyncio
    async def test_returns_list_and_total(self) -> None:
        restaurant = MagicMock()

        with (
            patch(
                "features.restaurants.service.crud.get_vendor_restaurants",
                new_callable=AsyncMock,
                return_value=[restaurant],
            ),
            patch(
                "features.restaurants.service.crud.count_vendor_restaurants",
                new_callable=AsyncMock,
                return_value=1,
            ),
            patch(
                "features.restaurants.schemas.RestaurantResponse.model_validate",
                return_value=MagicMock(),
            ),
        ):
            data, total = await get_my_restaurants(AsyncMock(), uuid.uuid4())
        assert total == 1
        assert len(data) == 1
