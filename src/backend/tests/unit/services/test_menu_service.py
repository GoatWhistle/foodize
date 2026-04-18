import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.menu.service import get_menu


class TestMenuService:
    @pytest.mark.asyncio
    async def test_get_menu(self):
        with patch("features.menu.service.get_menu_items", new_callable=AsyncMock, return_value=[]):
            res = await get_menu(MagicMock(), uuid.uuid4())
            assert res == []
