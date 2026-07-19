import json
from unittest.mock import AsyncMock, patch

from features.ai_order_agent.search import semantic_search

from .ai_search_helpers import apply_llm_settings, candidate, mock_embedding_client, ranked


class TestSemanticSearchRanking:
    async def test_no_candidates_returns_empty(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        cache.get = AsyncMock(return_value=None)
        client = mock_embedding_client()

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.get_embedding_client",
                new_callable=AsyncMock,
                return_value=client,
            ),
            patch(
                "features.ai_order_agent.search.crud.list_orderable_items",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.ai_order_agent.search.crud.semantic_rank_items",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            apply_llm_settings(mock_settings)
            result = await semantic_search(session, cache, query="еда")

        assert result == []

    async def test_lexical_bonus_reorders_results(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        closest = candidate("Ролл")
        lexical = candidate("Бургер классический")
        cache.get = AsyncMock(return_value=json.dumps([0.5, 0.5]))
        client = mock_embedding_client()

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.get_embedding_client",
                new_callable=AsyncMock,
                return_value=client,
            ),
            patch(
                "features.ai_order_agent.search.crud.list_orderable_items",
                new_callable=AsyncMock,
                return_value=[],
            ),
            patch(
                "features.ai_order_agent.search.crud.semantic_rank_items",
                new_callable=AsyncMock,
                return_value=[ranked(closest, 0.10), ranked(lexical, 0.13)],
            ),
        ):
            apply_llm_settings(mock_settings)
            result = await semantic_search(session, cache, query="бургер")

        assert [item["name"] for item in result] == ["Бургер классический", "Ролл"]
