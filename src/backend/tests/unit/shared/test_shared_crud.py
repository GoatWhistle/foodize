from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from shared.crud import get_or_404
from shared.exceptions.existence import NotFoundException


@pytest.mark.asyncio
async def test_get_or_404_found() -> None:
    obj = MagicMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = obj
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    model = MagicMock()
    model.__name__ = "FakeModel"
    model.id = MagicMock()

    with patch("shared.crud.select", return_value=MagicMock()):
        result: object = await get_or_404(session, model, 1)
    assert result == obj


@pytest.mark.asyncio
async def test_get_or_404_not_found_default_detail() -> None:
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    model = MagicMock()
    model.__name__ = "FakeModel"
    model.id = MagicMock()

    with patch("shared.crud.select", return_value=MagicMock()):
        with pytest.raises(NotFoundException):
            await get_or_404(session, model, 99)


@pytest.mark.asyncio
async def test_get_or_404_not_found_custom_detail() -> None:
    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = None
    session = AsyncMock()
    session.execute = AsyncMock(return_value=mock_result)

    model = MagicMock()
    model.__name__ = "FakeModel"
    model.id = MagicMock()

    with patch("shared.crud.select", return_value=MagicMock()):
        with pytest.raises(NotFoundException) as exc_info:
            await get_or_404(session, model, 99, detail="Custom error")
    assert exc_info.value.detail == "Custom error"
