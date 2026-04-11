import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.menu.service import get_restaurant_menu_logic


class TestMenuService:
    @pytest.mark.asyncio
    async def test_get_restaurant_menu_logic(self):
        with patch(
            "features.menu.service.get_menu_items_from_db", new_callable=AsyncMock, return_value=[]
        ):
            res = await get_restaurant_menu_logic(MagicMock(), uuid.uuid4())
            assert res == []
