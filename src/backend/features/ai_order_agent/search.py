import asyncio
import hashlib
import json
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from features.ai_order_agent import crud
from infra.cache.base import CacheRepository
from infra.llm import EmbeddingClient, get_embedding_client
from settings.config.app_config import settings

logger = logging.getLogger(__name__)

_QUERY_EMBED_TTL_SECONDS = 7 * 86_400
_RERANK_POOL = 50
_NAME_MATCH_BONUS = 0.05


def _item_text(item: dict) -> str:
    return f"{item['name']}. {item.get('description') or ''}".strip()


def _text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _query_cache_key(model: str, query: str) -> str:
    digest = hashlib.sha256(query.encode("utf-8")).hexdigest()
    return f"emb:query:{model}:{digest}"


async def _get_query_embedding(
    client: EmbeddingClient,
    cache: CacheRepository,
    model: str,
    query: str,
) -> list[float]:
    key = _query_cache_key(model, query)
    cached = await cache.get(key)
    if cached:
        return json.loads(cached)
    result = await client.embed([query])
    embedding = result[0]
    await cache.set(key, json.dumps(embedding), ttl=_QUERY_EMBED_TTL_SECONDS)
    return embedding


async def _sync_item_embeddings(
    session: AsyncSession,
    client: EmbeddingClient,
    model: str,
    *,
    max_price: int | None,
    restaurant_id: uuid.UUID | None,
) -> None:
    """Ленивая догрузка pgvector: эмбеддим кандидатов без записи или с изменившимся текстом."""
    candidates = await crud.list_orderable_items(
        session,
        max_price=max_price,
        restaurant_id=restaurant_id,
        limit=settings.llm.embedding_candidate_limit,
    )
    if not candidates:
        return

    item_ids = [uuid.UUID(item["menu_item_id"]) for item in candidates]
    stored = await crud.get_embedding_meta(session, item_ids, model)

    stale: list[tuple[uuid.UUID, str, str]] = []
    for item in candidates:
        text = _item_text(item)
        digest = _text_hash(text)
        item_id = uuid.UUID(item["menu_item_id"])
        if stored.get(item_id) != digest:
            stale.append((item_id, text, digest))
    if not stale:
        return

    vectors = await client.embed([text for _, text, _ in stale])
    dim = settings.llm.embedding_dim
    rows = []
    for (item_id, _, digest), vector in zip(stale, vectors):
        if len(vector) != dim:
            raise ValueError(
                f"embedding dimension mismatch: model={model} got={len(vector)} expected={dim}"
            )
        rows.append(
            {"menu_item_id": item_id, "model": model, "text_hash": digest, "embedding": vector}
        )
    await crud.upsert_embeddings(session, rows)
    logger.info("menu_item_embeddings upserted model=%s count=%s", model, len(rows))


async def semantic_search(
    session: AsyncSession,
    cache: CacheRepository,
    *,
    query: str | None,
    max_price: int | None = None,
    restaurant_id: uuid.UUID | None = None,
    limit: int = 15,
) -> list[dict]:
    cfg = settings.llm
    if not cfg.embeddings_enabled or not query or not query.strip():
        return await crud.search_menu_items(
            session, query=query, max_price=max_price, restaurant_id=restaurant_id, limit=limit
        )

    try:
        client = await get_embedding_client()
        model = client.model

        query_embedding, _ = await asyncio.gather(
            _get_query_embedding(client, cache, model, query.strip()),
            _sync_item_embeddings(
                session, client, model, max_price=max_price, restaurant_id=restaurant_id
            ),
        )
        if len(query_embedding) != cfg.embedding_dim:
            raise ValueError(
                f"query embedding dimension mismatch: model={model} "
                f"got={len(query_embedding)} expected={cfg.embedding_dim}"
            )

        ranked = await crud.semantic_rank_items(
            session,
            query_embedding=query_embedding,
            model=model,
            max_price=max_price,
            restaurant_id=restaurant_id,
            limit=_RERANK_POOL,
        )
        if not ranked:
            return []

        # Гибридный скоринг: косинусная близость из pgvector + лексический бонус
        # за точное вхождение запроса в название.
        query_lower = query.strip().lower()
        scored: list[tuple[float, dict]] = []
        for item in ranked:
            score = 1.0 - item.pop("_distance")
            if query_lower in (item["name"] or "").lower():
                score += _NAME_MATCH_BONUS
            scored.append((score, item))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return [item for _, item in scored[:limit]]
    except Exception:
        logger.error(
            "embedding_degraded reason=exception — semantic search failed, "
            "falling back to keyword search",
            exc_info=True,
        )
        return await crud.search_menu_items(
            session, query=query, max_price=max_price, restaurant_id=restaurant_id, limit=limit
        )
