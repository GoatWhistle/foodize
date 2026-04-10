import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate
from features.restaurants.service import (
    get_my_restaurants,
    register_new_restaurant,
    update_restaurant_logic,
)
from shared.exceptions.existence import NotFoundException


def make_mock_restaurant(restaurant_id: uuid.UUID = None, vendor_id: uuid.UUID = None):
    r = MagicMock()
    r.id = restaurant_id or uuid.uuid4()
    r.vendor_id = vendor_id or uuid.uuid4()
    r.name = "Test Restaurant"
    r.address = "Test Street 1"
    return r


class TestRegisterNewRestaurant:
    async def test_creates_restaurant(self, mock_db_session):
        vendor_id = uuid.uuid4()
        mock_restaurant = make_mock_restaurant(vendor_id=vendor_id)
        restaurant_data = RestaurantCreate(name="Sushi Bar", address="Lenin St 1")

        with patch(
            "features.restaurants.service.create_restaurant_in_db",
            new_callable=AsyncMock,
            return_value=mock_restaurant,
        ) as mock_create:
            result = await register_new_restaurant(mock_db_session, restaurant_data, vendor_id)

        assert result is mock_restaurant
        mock_create.assert_awaited_once_with(mock_db_session, restaurant_data, vendor_id)


class TestUpdateRestaurantLogic:
    async def test_update_success(self, mock_db_session):
        vendor_id = uuid.uuid4()
        restaurant_id = uuid.uuid4()
        mock_restaurant = make_mock_restaurant(restaurant_id, vendor_id)
        update_data = RestaurantUpdate(name="New Name")

        with (
            patch(
                "features.restaurants.service.get_restaurant_and_check_ownership",
                new_callable=AsyncMock,
                return_value=mock_restaurant,
            ),
            patch(
                "features.restaurants.service.update_restaurant_in_db",
                new_callable=AsyncMock,
                return_value=mock_restaurant,
            ) as mock_update,
        ):
            result = await update_restaurant_logic(
                mock_db_session, restaurant_id, update_data, vendor_id
            )

        assert result is mock_restaurant
        mock_update.assert_awaited_once_with(mock_db_session, mock_restaurant, update_data)

    async def test_update_wrong_vendor_raises(self, mock_db_session):
        with patch(
            "features.restaurants.service.get_restaurant_and_check_ownership",
            new_callable=AsyncMock,
            side_effect=NotFoundException(),
        ):
            with pytest.raises(NotFoundException):
                await update_restaurant_logic(
                    mock_db_session,
                    uuid.uuid4(),
                    RestaurantUpdate(name="x"),
                    uuid.uuid4(),
                )


class TestGetMyRestaurants:
    async def test_returns_vendor_restaurants(self, mock_db_session):
        vendor_id = uuid.uuid4()
        restaurants = [make_mock_restaurant(vendor_id=vendor_id) for _ in range(2)]

        with patch(
            "features.restaurants.service.get_vendor_restaurants_from_db",
            new_callable=AsyncMock,
            return_value=restaurants,
        ):
            result = await get_my_restaurants(mock_db_session, vendor_id)

        assert len(result) == 2

    async def test_returns_empty_when_no_restaurants(self, mock_db_session):
        with patch(
            "features.restaurants.service.get_vendor_restaurants_from_db",
            new_callable=AsyncMock,
            return_value=[],
        ):
            result = await get_my_restaurants(mock_db_session, uuid.uuid4())

        assert result == []
