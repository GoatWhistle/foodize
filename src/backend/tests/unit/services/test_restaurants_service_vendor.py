import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate
from features.restaurants.service import (
    create_restaurant_for_vendor,
    get_my_restaurants,
    update_restaurant_for_vendor,
)
from shared.enums.moderation_status import ModerationStatus
from shared.exceptions.rules import AccessDeniedException

from .restaurants_service_helpers import make_restaurant


class TestCreateRestaurantForVendor:
    async def test_vendor_not_found_raises(self) -> None:
        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=None)
        session.execute = AsyncMock(return_value=mock_result)

        data = RestaurantCreate(name="Test", address="Addr", is_open=True, is_hiring=False)
        with pytest.raises(AccessDeniedException):
            await create_restaurant_for_vendor(session, data, uuid.uuid4())

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

    async def test_creates_restaurant_success(self) -> None:
        vendor = MagicMock()
        vendor.approval_status = ModerationStatus.APPROVED.value
        vendor.user.permissions = []

        mock_restaurant = make_restaurant()
        mock_restaurant.moderation_status = ModerationStatus.PENDING.value

        session = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none = MagicMock(return_value=vendor)
        session.execute = AsyncMock(return_value=mock_result)
        session.commit = AsyncMock()
        session.refresh = AsyncMock()

        data = RestaurantCreate(name="Test", address="Addr", is_open=True, is_hiring=False)

        with patch(
            "features.restaurants.service.crud.create_restaurant",
            new_callable=AsyncMock,
            return_value=mock_restaurant,
        ):
            result = await create_restaurant_for_vendor(session, data, uuid.uuid4())
        assert result.id == mock_restaurant.id


class TestUpdateRestaurantForVendor:
    async def test_success(self) -> None:
        restaurant = make_restaurant()
        updated = make_restaurant(restaurant_id=restaurant.id)

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
        ):
            result = await update_restaurant_for_vendor(session, uuid.uuid4(), data, uuid.uuid4())
        assert result.id == updated.id


class TestGetMyRestaurants:
    async def test_returns_list_and_total(self) -> None:
        restaurant = make_restaurant()

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
        ):
            data, total = await get_my_restaurants(AsyncMock(), uuid.uuid4())
        assert total == 1
        assert len(data) == 1
