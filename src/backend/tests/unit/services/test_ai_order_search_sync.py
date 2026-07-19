import json
import uuid
from unittest.mock import AsyncMock, patch

from features.ai_order_agent.search import _item_text, _text_hash, semantic_search

from .ai_search_helpers import apply_llm_settings, candidate, mock_embedding_client, ranked


class TestSemanticSearchEmbeddingSync:
    async def test_fresh_embeddings_skip_embedder_and_upsert(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        item = candidate("Бургер", "Вкусный")
        digest = _text_hash(_item_text(item))
        query_embedding = [0.5, 0.5]
        cache.get = AsyncMock(return_value=json.dumps(query_embedding))
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
                return_value=[ranked(item, 0.1)],
            ),
        ):
            apply_llm_settings(mock_settings)
            result = await semantic_search(session, cache, query="бургер")

        client.embed.assert_not_awaited()
        upsert.assert_not_awaited()
        assert len(result) == 1
        assert result[0]["name"] == "Бургер"
        assert "_distance" not in result[0]

    async def test_stale_hash_reembeds_and_upserts(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        item = candidate("Пицца", "Итальянская")
        query_embedding = [0.3, 0.7]
        item_embedding = [0.2, 0.8]
        cache.get = AsyncMock(return_value=json.dumps(query_embedding))
        client = mock_embedding_client([item_embedding])

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
                return_value=[ranked(item, 0.1)],
            ),
        ):
            apply_llm_settings(mock_settings)
            result = await semantic_search(session, cache, query="пицца")

        client.embed.assert_awaited_once_with([_item_text(item)])
        upsert.assert_awaited_once()
        rows = upsert.await_args.args[1]  # type: ignore[union-attr]
        assert rows == [
            {
                "menu_item_id": uuid.UUID(item["menu_item_id"]),
                "model": "model-x",
                "text_hash": _text_hash(_item_text(item)),
                "embedding": item_embedding,
            }
        ]
        session.commit.assert_awaited()
        assert len(result) == 1

    async def test_sync_acquires_lock_and_commits_when_fresh(self) -> None:
        session = AsyncMock()
        cache = AsyncMock()
        item = candidate("Суп", "Горячий")
        digest = _text_hash(_item_text(item))
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
                return_value=[item],
            ),
            patch(
                "features.ai_order_agent.search.crud.acquire_embedding_sync_lock",
                new_callable=AsyncMock,
            ) as lock,
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
                return_value=[ranked(item, 0.1)],
            ),
        ):
            apply_llm_settings(mock_settings)
            await semantic_search(session, cache, query="суп")

        lock.assert_awaited_once_with(session, "model-x")
        upsert.assert_not_awaited()
        session.commit.assert_awaited_once()
