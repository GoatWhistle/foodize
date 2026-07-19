import hashlib
import json
import logging
import uuid
from typing import Any, cast

from sqlalchemy.ext.asyncio import AsyncSession

from features.ai_order_agent import crud
from infra.cache.base import CacheRepository
from infra.llm import EmbeddingClient, get_embedding_client
from settings.config.app_config import settings

logger = logging.getLogger(__name__)

_QUERY_EMBED_TTL_SECONDS = 7 * 86_400
_RERANK_POOL = 50
_NAME_MATCH_BONUS = 0.05


def _item_text(item: dict[str, Any]) -> str:
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
        return cast("list[float]", json.loads(cached))
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
    candidates = await crud.list_orderable_items(
        session,
        max_price=max_price,
        restaurant_id=restaurant_id,
        limit=settings.llm.embedding_candidate_limit,
    )
    if not candidates:
        return

    item_by_id = {uuid.UUID(item["menu_item_id"]): item for item in candidates}
    await crud.acquire_embedding_sync_lock(session, model)
    stored = await crud.get_embedding_meta(session, list(item_by_id), model)

    stale: list[tuple[uuid.UUID, str, str]] = []
    for item_id, item in item_by_id.items():
        item_text = _item_text(item)
        digest = _text_hash(item_text)
        if stored.get(item_id) != digest:
            stale.append((item_id, item_text, digest))
    if not stale:
        await session.commit()
        return

    vectors = await client.embed([item_text for _, item_text, _ in stale])
    embedding_rows = _build_embedding_rows(model, stale, vectors)
    await crud.upsert_embeddings(session, embedding_rows)
    await session.commit()
    logger.info("menu_item_embeddings upserted model=%s count=%s", model, len(embedding_rows))


def _build_embedding_rows(
    model: str,
    stale: list[tuple[uuid.UUID, str, str]],
    vectors: list[list[float]],
) -> list[dict[str, Any]]:
    expected_dim = settings.llm.embedding_dim
    embedding_rows = []
    for (item_id, _, digest), vector in zip(stale, vectors, strict=True):
        if len(vector) != expected_dim:
            raise ValueError(
                f"embedding dimension mismatch: model={model} "
                f"got={len(vector)} expected={expected_dim}"
            )
        embedding_rows.append(
            {"menu_item_id": item_id, "model": model, "text_hash": digest, "embedding": vector}
        )
    return embedding_rows


def _rerank_by_score(ranked: list[dict[str, Any]], query: str, limit: int) -> list[dict[str, Any]]:
    query_lower = query.lower()
    scored: list[tuple[float, dict[str, Any]]] = []
    for menu_item in ranked:
        score = 1.0 - menu_item.pop("_distance")
        if query_lower in (menu_item["name"] or "").lower():
            score += _NAME_MATCH_BONUS
        scored.append((score, menu_item))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [menu_item for _, menu_item in scored[:limit]]


async def _semantic_ranked_search(
    session: AsyncSession,
    cache: CacheRepository,
    *,
    query: str,
    max_price: int | None,
    restaurant_id: uuid.UUID | None,
    limit: int,
) -> list[dict[str, Any]]:
    client = await get_embedding_client()
    model = client.model

    await _sync_item_embeddings(
        session, client, model, max_price=max_price, restaurant_id=restaurant_id
    )
    query_embedding = await _get_query_embedding(client, cache, model, query)
    expected_dim = settings.llm.embedding_dim
    if len(query_embedding) != expected_dim:
        raise ValueError(
            f"query embedding dimension mismatch: model={model} "
            f"got={len(query_embedding)} expected={expected_dim}"
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
    return _rerank_by_score(ranked, query, limit)


async def semantic_search(
    session: AsyncSession,
    cache: CacheRepository,
    *,
    query: str | None,
    max_price: int | None = None,
    restaurant_id: uuid.UUID | None = None,
    limit: int = 15,
) -> list[dict[str, Any]]:
    cfg = settings.llm
    if not cfg.embeddings_enabled or not query or not query.strip():
        return await crud.search_menu_items(
            session, query=query, max_price=max_price, restaurant_id=restaurant_id, limit=limit
        )

    try:
        return await _semantic_ranked_search(
            session,
            cache,
            query=query.strip(),
            max_price=max_price,
            restaurant_id=restaurant_id,
            limit=limit,
        )
    except Exception:
        logger.error(
            "embedding_degraded reason=exception — semantic search failed, "
            "falling back to keyword search",
            exc_info=True,
        )
        return await crud.search_menu_items(
            session, query=query, max_price=max_price, restaurant_id=restaurant_id, limit=limit
        )
