import uuid
from collections.abc import Sequence
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.exc import IntegrityError

from features.restaurants.crud import (
    count_restaurants,
    count_vendor_restaurants,
    create_restaurant,
    get_all_restaurants,
    get_restaurant_by_display_id,
    get_restaurant_by_id,
    get_vendor_restaurants,
    update_restaurant,
)
from features.restaurants.schemas import RestaurantCreate, RestaurantUpdate
from shared.exceptions.existence import AlreadyExistsException


def _mock_session_with(
    scalar_result: object = None,
    scalars_list: Sequence[object] | None = None,
    scalar_one: object = None,
) -> AsyncMock:
    session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none = MagicMock(return_value=scalar_result)
    if scalars_list is not None:
        mock_result.scalars = MagicMock(
            return_value=MagicMock(all=MagicMock(return_value=scalars_list))
        )
    if scalar_one is not None:
        mock_result.scalar_one = MagicMock(return_value=scalar_one)
    session.execute = AsyncMock(return_value=mock_result)
    return session


async def test_get_restaurant_by_id() -> None:
    restaurant = MagicMock()
    session = _mock_session_with(scalar_result=restaurant)
    result = await get_restaurant_by_id(session, uuid.uuid4())
    assert result == restaurant


async def test_get_restaurant_by_display_id_found() -> None:
    restaurant = MagicMock()
    session = _mock_session_with(scalar_result=restaurant)
    result = await get_restaurant_by_display_id(session, "abc123")
    assert result == restaurant


async def test_get_restaurant_by_display_id_not_found() -> None:
    session = _mock_session_with(scalar_result=None)
    result = await get_restaurant_by_display_id(session, "unknown")
    assert result is None


async def test_get_vendor_restaurants() -> None:
    restaurant = MagicMock()
    session = _mock_session_with(scalars_list=[restaurant])
    result = await get_vendor_restaurants(session, uuid.uuid4())
    assert result == [restaurant]


async def test_count_vendor_restaurants() -> None:
    session = _mock_session_with(scalar_one=3)
    result = await count_vendor_restaurants(session, uuid.uuid4())
    assert result == 3


async def test_count_restaurants_no_filters() -> None:
    session = _mock_session_with(scalar_one=10)
    result = await count_restaurants(session)
    assert result == 10


async def test_count_restaurants_with_filters() -> None:
    session = _mock_session_with(scalar_one=2)
    result = await count_restaurants(session, name="pizza", is_open=True, is_hiring=False)
    assert result == 2


async def test_get_all_restaurants_no_filters() -> None:
    restaurant = MagicMock()
    session = _mock_session_with(scalars_list=[restaurant])
    result = await get_all_restaurants(session)
    assert result == [restaurant]


async def test_get_all_restaurants_with_filters() -> None:
    restaurant = MagicMock()
    session = _mock_session_with(scalars_list=[restaurant])
    result = await get_all_restaurants(session, name="burger", is_open=True, is_hiring=True)
    assert result == [restaurant]


async def test_create_restaurant_success() -> None:
    data = RestaurantCreate(
        name="My Cafe",
        address="Street 1",
        is_open=True,
        is_hiring=False,
        avg_prep_time_minutes=20,
    )
    vendor_id = uuid.uuid4()

    mock_restaurant = MagicMock()
    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock()
    session.rollback = AsyncMock()

    with (
        patch(
            "features.restaurants.crud._generate_unique_display_id",
            new_callable=AsyncMock,
            return_value="abc123",
        ),
        patch("features.restaurants.crud.Restaurant", return_value=mock_restaurant),
    ):
        result = await create_restaurant(session, data, vendor_id)

    assert result == mock_restaurant
    session.add.assert_called_once_with(mock_restaurant)


async def test_create_restaurant_integrity_error() -> None:
    data = RestaurantCreate(
        name="Duplicate",
        address="Same Street",
        is_open=True,
        is_hiring=False,
        avg_prep_time_minutes=20,
    )

    session = AsyncMock()
    session.add = MagicMock()
    session.flush = AsyncMock(side_effect=IntegrityError(None, None, Exception("duplicate")))
    session.rollback = AsyncMock()

    with (
        patch(
            "features.restaurants.crud._generate_unique_display_id",
            new_callable=AsyncMock,
            return_value="xyz",
        ),
        patch("features.restaurants.crud.Restaurant", return_value=MagicMock()),
        pytest.raises(AlreadyExistsException),
    ):
        await create_restaurant(session, data, uuid.uuid4())

    session.rollback.assert_awaited_once()


async def test_update_restaurant_success() -> None:
    restaurant = MagicMock()
    restaurant.name = "Old Name"
    data = RestaurantUpdate(name="New Name")

    session = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()

    await update_restaurant(session, restaurant, data)
    assert restaurant.name == "New Name"
    session.flush.assert_awaited_once()


async def test_update_restaurant_integrity_error() -> None:
    restaurant = MagicMock()
    data = RestaurantUpdate(address="Duplicate Address")

    session = AsyncMock()
    session.flush = AsyncMock(side_effect=IntegrityError(None, None, Exception("dup")))
    session.rollback = AsyncMock()

    with pytest.raises(AlreadyExistsException):
        await update_restaurant(session, restaurant, data)

    session.rollback.assert_awaited_once()
