import json
from unittest.mock import AsyncMock, patch

from features.ai_order_agent.search import semantic_search

from .ai_search_helpers import apply_llm_settings, candidate, mock_embedding_client


class TestSemanticSearchFallback:
    async def test_embeddings_disabled_falls_back(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        items = [candidate("Бургер")]

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.crud.search_menu_items",
                new_callable=AsyncMock,
                return_value=items,
            ),
        ):
            mock_settings.llm.embeddings_enabled = False
            result = await semantic_search(session, cache, query="бургер")

        assert result == items

    async def test_empty_query_falls_back(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        items = [candidate("Пицца")]

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.crud.search_menu_items",
                new_callable=AsyncMock,
                return_value=items,
            ),
        ):
            mock_settings.llm.embeddings_enabled = True
            result = await semantic_search(session, cache, query=None)

        assert result == items

    async def test_dimension_mismatch_falls_back_to_keyword(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        cache.get = AsyncMock(return_value=json.dumps([0.1, 0.2, 0.3]))
        client = mock_embedding_client()
        fallback = [candidate("Шаурма")]

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
                "features.ai_order_agent.search.crud.search_menu_items",
                new_callable=AsyncMock,
                return_value=fallback,
            ),
        ):
            apply_llm_settings(mock_settings, dim=2)
            result = await semantic_search(session, cache, query="шаурма")

        assert result == fallback

    async def test_exception_falls_back_to_keyword(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        fallback = [candidate("Шаурма")]

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.get_embedding_client",
                new_callable=AsyncMock,
                side_effect=RuntimeError("fail"),
            ),
            patch(
                "features.ai_order_agent.search.crud.search_menu_items",
                new_callable=AsyncMock,
                return_value=fallback,
            ),
        ):
            apply_llm_settings(mock_settings)
            result = await semantic_search(session, cache, query="шаурма")

        assert result == fallback
