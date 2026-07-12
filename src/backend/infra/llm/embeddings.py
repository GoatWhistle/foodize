from __future__ import annotations

import asyncio
import hashlib

from settings.config.app_config import settings

_EMBED_BATCH_SIZE = 96
_EMBED_MAX_CONCURRENCY = 4


class EmbeddingClient:
    def __init__(self, *, api_key: str, base_url: str, model: str, timeout: int = 60) -> None:
        from openai import AsyncOpenAI

        self._client = AsyncOpenAI(api_key=api_key or "ollama", base_url=base_url, timeout=timeout)
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    async def _embed_batch(
        self, batch: list[str], semaphore: asyncio.Semaphore
    ) -> list[list[float]]:
        async with semaphore:
            response = await self._client.embeddings.create(model=self._model, input=batch)
            return [item.embedding for item in response.data]

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        batches = [
            texts[start : start + _EMBED_BATCH_SIZE]
            for start in range(0, len(texts), _EMBED_BATCH_SIZE)
        ]
        semaphore = asyncio.Semaphore(_EMBED_MAX_CONCURRENCY)
        batch_results = await asyncio.gather(
            *(self._embed_batch(batch, semaphore) for batch in batches)
        )
        return [embedding for batch_result in batch_results for embedding in batch_result]

    async def aclose(self) -> None:
        await self._client.close()


_client: EmbeddingClient | None = None
_client_fingerprint: str | None = None
_client_lock: asyncio.Lock | None = None


def _get_lock() -> asyncio.Lock:
    global _client_lock
    if _client_lock is None:
        _client_lock = asyncio.Lock()
    return _client_lock


def _embedding_fingerprint() -> str:
    cfg = settings.llm
    parts = (
        cfg.embedding_api_key,
        cfg.embedding_base_url,
        cfg.embedding_model,
        str(cfg.request_timeout_seconds),
    )
    return hashlib.sha256("|".join(parts).encode()).hexdigest()[:16]


async def get_embedding_client() -> EmbeddingClient:
    global _client, _client_fingerprint
    fingerprint = _embedding_fingerprint()
    if _client is not None and _client_fingerprint == fingerprint:
        return _client
    async with _get_lock():
        if _client is None or _client_fingerprint != fingerprint:
            if _client is not None:
                await _client.aclose()
            cfg = settings.llm
            _client = EmbeddingClient(
                api_key=cfg.embedding_api_key,
                base_url=cfg.embedding_base_url,
                model=cfg.embedding_model,
                timeout=cfg.request_timeout_seconds,
            )
            _client_fingerprint = fingerprint
    return _client
