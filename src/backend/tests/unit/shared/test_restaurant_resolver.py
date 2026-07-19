import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.restaurants.exceptions import RestaurantNotFoundException
from shared.restaurant_resolver import resolve_restaurant_uuid


async def test_resolve_by_valid_uuid() -> None:
    valid_id = uuid.uuid4()
    session = AsyncMock()
    result = await resolve_restaurant_uuid(session, str(valid_id))
    assert result == valid_id
    session.execute.assert_not_called()


async def test_resolve_by_display_id_found() -> None:
    rid = uuid.uuid4()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none = MagicMock(return_value=rid)
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    result = await resolve_restaurant_uuid(session, "my-cafe")
    assert result == rid


async def test_resolve_by_display_id_not_found() -> None:
    mock_result = MagicMock()
    mock_result.scalar_one_or_none = MagicMock(return_value=None)
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    with pytest.raises(RestaurantNotFoundException):
        await resolve_restaurant_uuid(session, "unknown-slug")
