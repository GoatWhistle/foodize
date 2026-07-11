import asyncio
import hashlib
import json
import logging
import uuid

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession

from features.ai_order_agent import crud
from infra.cache.base import CacheRepository
from infra.llm import get_embedding_client
from settings.config.app_config import settings

logger = logging.getLogger(__name__)

_EMBED_TTL_SECONDS = 7 * 86_400


def _item_text(item: dict) -> str:
    return f"{item['name']}. {item.get('description') or ''}".strip()


def _cache_key(model: str, text: str) -> str:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"emb:menuitem:{model}:{digest}"


def _query_cache_key(model: str, query: str) -> str:
    digest = hashlib.sha256(query.encode("utf-8")).hexdigest()
    return f"emb:query:{model}:{digest}"


def _cosine(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    va = np.asarray(a, dtype=np.float32)
    vb = np.asarray(b, dtype=np.float32)
    norm_a = np.linalg.norm(va)
    norm_b = np.linalg.norm(vb)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(va, vb) / (norm_a * norm_b))


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
        query_key = _query_cache_key(model, query.strip())

        candidates, cached_query = await asyncio.gather(
            crud.list_orderable_items(
                session,
                max_price=max_price,
                restaurant_id=restaurant_id,
                limit=cfg.embedding_candidate_limit,
            ),
            cache.get(query_key),
        )
        if not candidates:
            return []

        if cached_query:
            query_embedding = json.loads(cached_query)
        else:
            query_result = await client.embed([query])
            query_embedding = query_result[0]
            await cache.set(query_key, json.dumps(query_embedding), ttl=_EMBED_TTL_SECONDS)

        for item in candidates:
            text = _item_text(item)
            item["_text"] = text
            item["_key"] = _cache_key(model, text)

        keys = [item["_key"] for item in candidates]
        cached_values = await cache.mget(*keys)
        misses: list[dict] = []
        for item, cached in zip(candidates, cached_values):
            item["_embedding"] = json.loads(cached) if cached else None
            if item["_embedding"] is None:
                misses.append(item)

        if misses:
            fresh = await client.embed([item["_text"] for item in misses])
            new_entries: dict[str, str] = {}
            for item, embedding in zip(misses, fresh):
                item["_embedding"] = embedding
                new_entries[item["_key"]] = json.dumps(embedding)
            await cache.mset(new_entries, ttl=_EMBED_TTL_SECONDS)

        query_len = len(query_embedding)
        mismatched = 0
        query_lower = query.lower()
        scored: list[tuple[float, dict]] = []
        for item in candidates:
            embedding = item["_embedding"]
            if embedding and len(embedding) != query_len:
                mismatched += 1
            score = _cosine(query_embedding, embedding)
            if query_lower in (item["name"] or "").lower():
                score += 0.05
            scored.append((score, item))

        if mismatched:
            logger.error(
                "embedding_degraded reason=dimension_mismatch model=%s query_dim=%s "
                "mismatched=%s/%s — falling back to keyword search (stale cache?)",
                model,
                query_len,
                mismatched,
                len(candidates),
            )
            if mismatched > len(candidates) // 2:
                return await crud.search_menu_items(
                    session,
                    query=query,
                    max_price=max_price,
                    restaurant_id=restaurant_id,
                    limit=limit,
                )

        scored.sort(key=lambda pair: pair[0], reverse=True)
        top = [item for _, item in scored[:limit]]
        for item in top:
            for key in ("_text", "_key", "_embedding"):
                item.pop(key, None)
        return top
    except Exception:
        logger.error(
            "embedding_degraded reason=exception — semantic search failed, "
            "falling back to keyword search",
            exc_info=True,
        )
        return await crud.search_menu_items(
            session, query=query, max_price=max_price, restaurant_id=restaurant_id, limit=limit
        )
