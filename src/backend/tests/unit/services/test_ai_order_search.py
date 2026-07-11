import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from features.ai_order_agent.search import (
    _cache_key,
    _cosine,
    _item_text,
    semantic_search,
)


class TestItemText:
    def test_with_description(self):
        item = {"name": "Бургер", "description": "Сочный"}
        assert _item_text(item) == "Бургер. Сочный"

    def test_without_description(self):
        item = {"name": "Бургер", "description": None}
        assert _item_text(item) == "Бургер."

    def test_missing_description(self):
        item = {"name": "Пицца"}
        assert _item_text(item) == "Пицца."


class TestCacheKey:
    def test_returns_string(self):
        key = _cache_key("text-embedding-3-small", "бургер")
        assert isinstance(key, str)

    def test_starts_with_prefix(self):
        key = _cache_key("model", "text")
        assert key.startswith("emb:menuitem:")

    def test_same_inputs_same_key(self):
        k1 = _cache_key("model", "text")
        k2 = _cache_key("model", "text")
        assert k1 == k2

    def test_different_inputs_different_keys(self):
        k1 = _cache_key("model", "text1")
        k2 = _cache_key("model", "text2")
        assert k1 != k2


class TestCosine:
    def test_identical_vectors(self):
        v = [1.0, 0.0, 0.0]
        assert abs(_cosine(v, v) - 1.0) < 1e-5

    def test_orthogonal_vectors(self):
        a = [1.0, 0.0]
        b = [0.0, 1.0]
        assert abs(_cosine(a, b)) < 1e-5

    def test_empty_vectors(self):
        assert _cosine([], []) == 0.0

    def test_different_lengths(self):
        assert _cosine([1.0, 2.0], [1.0]) == 0.0

    def test_zero_vector(self):
        assert _cosine([0.0, 0.0], [1.0, 0.0]) == 0.0


class TestSemanticSearch:
    @pytest.mark.asyncio
    async def test_embeddings_disabled_falls_back(self):
        session = AsyncMock()
        cache = AsyncMock()
        items = [{"id": str(uuid.uuid4()), "name": "Бургер", "price": 200}]

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

    @pytest.mark.asyncio
    async def test_empty_query_falls_back(self):
        session = AsyncMock()
        cache = AsyncMock()
        items = [{"id": str(uuid.uuid4()), "name": "Пицца"}]

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

    @pytest.mark.asyncio
    async def test_no_candidates_returns_empty(self):
        session = AsyncMock()
        cache = AsyncMock()

        mock_client = AsyncMock()
        mock_client.model = "model-x"
        mock_client.embed = AsyncMock(return_value=[[0.1, 0.2]])

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.get_embedding_client",
                new_callable=AsyncMock,
                return_value=mock_client,
            ),
            patch(
                "features.ai_order_agent.search.crud.list_orderable_items",
                new_callable=AsyncMock,
                return_value=[],
            ),
        ):
            mock_settings.llm.embeddings_enabled = True
            mock_settings.llm.embedding_candidate_limit = 50
            result = await semantic_search(session, cache, query="еда")

        assert result == []

    @pytest.mark.asyncio
    async def test_semantic_search_with_cache_hit(self):
        session = AsyncMock()
        cache = AsyncMock()

        item_id = uuid.uuid4()
        candidates = [
            {"id": str(item_id), "name": "Бургер", "description": "Вкусный", "price": 250}
        ]
        embedding = [0.5, 0.5]
        cache.get = AsyncMock(return_value=None)
        cache.set = AsyncMock()
        cache.mget = AsyncMock(return_value=[json.dumps(embedding)])

        mock_client = AsyncMock()
        mock_client.model = "model-x"
        mock_client.embed = AsyncMock(return_value=[embedding])

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.get_embedding_client",
                new_callable=AsyncMock,
                return_value=mock_client,
            ),
            patch(
                "features.ai_order_agent.search.crud.list_orderable_items",
                new_callable=AsyncMock,
                return_value=candidates,
            ),
        ):
            mock_settings.llm.embeddings_enabled = True
            mock_settings.llm.embedding_candidate_limit = 50
            result = await semantic_search(session, cache, query="бургер")

        assert len(result) == 1
        assert result[0]["name"] == "Бургер"
        assert "_embedding" not in result[0]

    @pytest.mark.asyncio
    async def test_semantic_search_with_cache_miss(self):
        session = AsyncMock()
        cache = AsyncMock()
        cache.get = AsyncMock(return_value=None)
        cache.set = AsyncMock()
        cache.mget = AsyncMock(return_value=[None])
        cache.mset = AsyncMock()

        item_id = uuid.uuid4()
        candidates = [
            {"id": str(item_id), "name": "Пицца", "description": "Итальянская", "price": 350}
        ]
        embedding = [0.3, 0.7]

        mock_client = AsyncMock()
        mock_client.model = "model-x"
        mock_client.embed = AsyncMock(return_value=[embedding])

        with (
            patch("features.ai_order_agent.search.settings") as mock_settings,
            patch(
                "features.ai_order_agent.search.get_embedding_client",
                new_callable=AsyncMock,
                return_value=mock_client,
            ),
            patch(
                "features.ai_order_agent.search.crud.list_orderable_items",
                new_callable=AsyncMock,
                return_value=candidates,
            ),
        ):
            mock_settings.llm.embeddings_enabled = True
            mock_settings.llm.embedding_candidate_limit = 50
            result = await semantic_search(session, cache, query="пицца")

        cache.mset.assert_awaited_once()
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_exception_falls_back_to_keyword(self):
        session = AsyncMock()
        cache = AsyncMock()
        fallback = [{"id": str(uuid.uuid4()), "name": "Шаурма"}]

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
            mock_settings.llm.embeddings_enabled = True
            mock_settings.llm.embedding_candidate_limit = 50
            result = await semantic_search(session, cache, query="шаурма")

        assert result == fallback
