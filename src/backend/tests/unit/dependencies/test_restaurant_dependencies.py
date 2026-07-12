import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.restaurants.dependencies import get_restaurant_and_check_ownership
from shared.exceptions.existence import NotFoundException


def _session_returning(restaurant: object | None) -> AsyncMock:
    mock_session = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = restaurant
    mock_session.execute.return_value = result
    return mock_session


class TestRestaurantDependencies:
    @pytest.mark.asyncio
    async def test_get_restaurant_and_check_ownership_404(self) -> None:
        mock_session = _session_returning(None)

        with pytest.raises(NotFoundException):
            await get_restaurant_and_check_ownership(mock_session, uuid.uuid4(), uuid.uuid4())

    @pytest.mark.asyncio
    async def test_get_restaurant_and_check_ownership_wrong_owner(self) -> None:
        mock_rest = MagicMock(vendor_id=uuid.uuid4())
        mock_session = _session_returning(mock_rest)

        with pytest.raises(NotFoundException):
            await get_restaurant_and_check_ownership(mock_session, uuid.uuid4(), uuid.uuid4())
