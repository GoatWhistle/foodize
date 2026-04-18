import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.menu.service import get_menu


class TestMenuService:
    @pytest.mark.asyncio
    async def test_get_menu(self):
        with (
            patch("features.menu.crud.get_menu_items", new_callable=AsyncMock, return_value=[]),
            patch("features.menu.crud.count_menu_items", new_callable=AsyncMock, return_value=0),
        ):
            data, total = await get_menu(MagicMock(), uuid.uuid4())
            assert data == []
            assert total == 0
