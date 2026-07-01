import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.orders.crud.order_item import get_menu_items_by_ids, get_options_by_ids


def _scalars_result(items):
    mock_result = MagicMock()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = items
    mock_result.scalars.return_value = mock_scalars
    return mock_result


@pytest.mark.asyncio
async def test_get_menu_items_by_ids_returns_dict():
    item = MagicMock()
    item.id = uuid.uuid4()
    session = AsyncMock()
    session.execute = AsyncMock(return_value=_scalars_result([item]))

    result = await get_menu_items_by_ids(session, [item.id])
    assert item.id in result
    assert result[item.id] == item


@pytest.mark.asyncio
async def test_get_menu_items_by_ids_empty():
    session = AsyncMock()
    session.execute = AsyncMock(return_value=_scalars_result([]))
    result = await get_menu_items_by_ids(session, [])
    assert result == {}


@pytest.mark.asyncio
async def test_get_options_by_ids_empty():
    session = AsyncMock()
    result = await get_options_by_ids(session, [])
    assert result == {}
    session.execute.assert_not_called()


@pytest.mark.asyncio
async def test_get_options_by_ids_returns_dict():
    option = MagicMock()
    option.id = uuid.uuid4()
    session = AsyncMock()
    session.execute = AsyncMock(return_value=_scalars_result([option]))

    result = await get_options_by_ids(session, [option.id])
    assert option.id in result
    assert result[option.id] == option
