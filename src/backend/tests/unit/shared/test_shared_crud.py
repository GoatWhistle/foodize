import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.restaurants.models import Restaurant
from shared.crud import get_or_404
from shared.exceptions.existence import NotFoundException


def _session_returning(obj: object) -> AsyncMock:
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = obj
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)
    return session


async def test_get_or_404_found() -> None:
    obj = Restaurant()
    session = _session_returning(obj)
    result = await get_or_404(session, Restaurant, uuid.uuid4())
    assert result is obj


async def test_get_or_404_not_found_default_detail() -> None:
    session = _session_returning(None)
    with pytest.raises(NotFoundException) as exc_info:
        await get_or_404(session, Restaurant, uuid.uuid4())
    assert "Restaurant" in exc_info.value.detail


async def test_get_or_404_not_found_custom_detail() -> None:
    session = _session_returning(None)
    with pytest.raises(NotFoundException) as exc_info:
        await get_or_404(session, Restaurant, uuid.uuid4(), detail="Custom error")
    assert exc_info.value.detail == "Custom error"
