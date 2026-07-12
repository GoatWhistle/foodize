import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from features.reviews.crud import has_completed_order


class TestHasCompletedOrder:
    @pytest.mark.asyncio
    async def test_returns_true_when_found(self) -> None:
        mock_result = MagicMock()
        mock_result.scalar_one = MagicMock(return_value=True)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await has_completed_order(session, uuid.uuid4(), uuid.uuid4())
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_not_found(self) -> None:
        mock_result = MagicMock()
        mock_result.scalar_one = MagicMock(return_value=False)

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)

        result = await has_completed_order(session, uuid.uuid4(), uuid.uuid4())
        assert result is False
