import json
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from features.ai_order_agent.search import (
    _item_text,
    _query_cache_key,
    _text_hash,
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


class TestQueryCacheKey:
    def test_starts_with_prefix(self):
        assert _query_cache_key("model", "text").startswith("emb:query:")

    def test_same_inputs_same_key(self):
        assert _query_cache_key("model", "text") == _query_cache_key("model", "text")

    def test_different_inputs_different_keys(self):
        assert _query_cache_key("model", "text1") != _query_cache_key("model", "text2")


def _candidate(name: str, description: str | None = None) -> dict:
    return {
        "menu_item_id": str(uuid.uuid4()),
        "name": name,
        "description": description,
        "price": 250,
        "category": "shaurma",
        "restaurant_id": str(uuid.uuid4()),
        "restaurant_name": "R",
        "restaurant_address": "A",
    }


def _ranked(item: dict, distance: float) -> dict:
    return {**item, "_distance": distance}


def _mock_client(embeddings: list[list[float]] | None = None) -> AsyncMock:
    client = AsyncMock()
    client.model = "model-x"
    client.embed = AsyncMock(return_value=embeddings or [[0.1, 0.2]])
    return client


def _settings(mock_settings, dim: int = 2) -> None:
    mock_settings.llm.embeddings_enabled = True
    mock_settings.llm.embedding_candidate_limit = 50
    mock_settings.llm.embedding_dim = dim


class TestSemanticSearch:
    @pytest.mark.asyncio
    async def test_embeddings_disabled_falls_back(self):
        session = AsyncMock()
        cache = AsyncMock()
        items = [{"menu_item_id": str(uuid.uuid4()), "name": "Бургер", "price": 200}]

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
        items = [{"menu_item_id": str(uuid.uuid4()), "name": "Пицца"}]

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
        cache.get = AsyncMock(return_value=None)
        client = _mock_client()

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
            _settings(mock_settings)
            result = await semantic_search(session, cache, query="еда")

        assert result == []

    @pytest.mark.asyncio
    async def test_fresh_embeddings_skip_embedder_and_upsert(self):
        session = AsyncMock()
        cache = AsyncMock()
        item = _candidate("Бургер", "Вкусный")
        digest = _text_hash(_item_text(item))
        query_embedding = [0.5, 0.5]
        cache.get = AsyncMock(return_value=json.dumps(query_embedding))
        client = _mock_client()

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
                return_value=[item],
            ),
            patch(
                "features.ai_order_agent.search.crud.get_embedding_meta",
                new_callable=AsyncMock,
                return_value={uuid.UUID(item["menu_item_id"]): digest},
            ),
            patch(
                "features.ai_order_agent.search.crud.upsert_embeddings",
                new_callable=AsyncMock,
            ) as upsert,
            patch(
                "features.ai_order_agent.search.crud.semantic_rank_items",
                new_callable=AsyncMock,
                return_value=[_ranked(item, 0.1)],
            ),
        ):
            _settings(mock_settings)
            result = await semantic_search(session, cache, query="бургер")

        client.embed.assert_not_awaited()
        upsert.assert_not_awaited()
        assert len(result) == 1
        assert result[0]["name"] == "Бургер"
        assert "_distance" not in result[0]

    @pytest.mark.asyncio
    async def test_stale_hash_reembeds_and_upserts(self):
        session = AsyncMock()
        cache = AsyncMock()
        item = _candidate("Пицца", "Итальянская")
        query_embedding = [0.3, 0.7]
        item_embedding = [0.2, 0.8]
        cache.get = AsyncMock(return_value=json.dumps(query_embedding))
        client = _mock_client([item_embedding])

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
                return_value=[item],
            ),
            patch(
                "features.ai_order_agent.search.crud.get_embedding_meta",
                new_callable=AsyncMock,
                return_value={uuid.UUID(item["menu_item_id"]): "устаревший-хеш"},
            ),
            patch(
                "features.ai_order_agent.search.crud.upsert_embeddings",
                new_callable=AsyncMock,
            ) as upsert,
            patch(
                "features.ai_order_agent.search.crud.semantic_rank_items",
                new_callable=AsyncMock,
                return_value=[_ranked(item, 0.1)],
            ),
        ):
            _settings(mock_settings)
            result = await semantic_search(session, cache, query="пицца")

        client.embed.assert_awaited_once_with([_item_text(item)])
        upsert.assert_awaited_once()
        rows = upsert.await_args.args[1]
        assert rows == [
            {
                "menu_item_id": uuid.UUID(item["menu_item_id"]),
                "model": "model-x",
                "text_hash": _text_hash(_item_text(item)),
                "embedding": item_embedding,
            }
        ]
        assert len(result) == 1

    @pytest.mark.asyncio
    async def test_lexical_bonus_reorders_results(self):
        session = AsyncMock()
        cache = AsyncMock()
        closest = _candidate("Ролл")
        lexical = _candidate("Бургер классический")
        cache.get = AsyncMock(return_value=json.dumps([0.5, 0.5]))
        client = _mock_client()

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
                # «Ролл» ближе по вектору, но бонус за вхождение «бургер» в
                # название должен вывести «Бургер классический» вперёд.
                return_value=[_ranked(closest, 0.10), _ranked(lexical, 0.13)],
            ),
        ):
            _settings(mock_settings)
            result = await semantic_search(session, cache, query="бургер")

        assert [item["name"] for item in result] == ["Бургер классический", "Ролл"]

    @pytest.mark.asyncio
    async def test_dimension_mismatch_falls_back_to_keyword(self):
        session = AsyncMock()
        cache = AsyncMock()
        cache.get = AsyncMock(return_value=json.dumps([0.1, 0.2, 0.3]))
        client = _mock_client()
        fallback = [{"menu_item_id": str(uuid.uuid4()), "name": "Шаурма"}]

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
            _settings(mock_settings, dim=2)
            result = await semantic_search(session, cache, query="шаурма")

        assert result == fallback

    @pytest.mark.asyncio
    async def test_exception_falls_back_to_keyword(self):
        session = AsyncMock()
        cache = AsyncMock()
        fallback = [{"menu_item_id": str(uuid.uuid4()), "name": "Шаурма"}]

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
            _settings(mock_settings)
            result = await semantic_search(session, cache, query="шаурма")

        assert result == fallback
