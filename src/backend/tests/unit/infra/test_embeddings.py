import asyncio
from collections.abc import Callable
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import infra.llm.embeddings as embeddings_mod
from infra.llm.embeddings import EmbeddingClient, get_embedding_client


def _make_client(
    embed_side_effect: BaseException | Callable[..., object] | None = None,
) -> tuple[EmbeddingClient, MagicMock]:
    with patch("openai.AsyncOpenAI") as fake_openai:
        inner = MagicMock()
        inner.embeddings.create = AsyncMock()
        inner.close = AsyncMock()
        fake_openai.return_value = inner
        client = EmbeddingClient(api_key="k", base_url="http://x/v1", model="bge-m3")
    if embed_side_effect is not None:
        inner.embeddings.create.side_effect = embed_side_effect
    return client, inner


def _embedding_response(vectors: list[list[float]]) -> SimpleNamespace:
    return SimpleNamespace(data=[SimpleNamespace(embedding=vector) for vector in vectors])


class TestEmbeddingClient:
    def test_model_property(self) -> None:
        client, _ = _make_client()
        assert client.model == "bge-m3"

    def test_missing_api_key_defaults_to_ollama(self) -> None:
        with patch("openai.AsyncOpenAI") as fake_openai:
            EmbeddingClient(api_key="", base_url="http://x/v1", model="m")
        _, kwargs = fake_openai.call_args
        assert kwargs["api_key"] == "ollama"

    async def test_embed_empty_returns_empty(self) -> None:
        client, inner = _make_client()
        result = await client.embed([])
        assert result == []
        inner.embeddings.create.assert_not_awaited()

    async def test_embed_single_batch_maps_vectors(self) -> None:
        client, inner = _make_client()
        inner.embeddings.create.return_value = _embedding_response([[0.1, 0.2], [0.3, 0.4]])
        result = await client.embed(["a", "b"])
        assert result == [[0.1, 0.2], [0.3, 0.4]]
        inner.embeddings.create.assert_awaited_once_with(model="bge-m3", input=["a", "b"])

    async def test_embed_batches_over_batch_size(self) -> None:
        client, inner = _make_client()
        total = embeddings_mod._EMBED_BATCH_SIZE + 5
        texts = [f"t{i}" for i in range(total)]

        async def _create(*, model: str, input: list[str]) -> SimpleNamespace:
            del model
            return _embedding_response([[float(len(input))]] * len(input))

        inner.embeddings.create.side_effect = _create
        result = await client.embed(texts)
        assert len(result) == total
        assert inner.embeddings.create.await_count == 2

    async def test_embed_preserves_order_across_batches(self) -> None:
        client, inner = _make_client()
        total = embeddings_mod._EMBED_BATCH_SIZE + 3
        texts = [str(i) for i in range(total)]

        async def _create(*, model: str, input: list[str]) -> SimpleNamespace:
            del model
            return _embedding_response([[float(value)] for value in input])

        inner.embeddings.create.side_effect = _create
        result = await client.embed(texts)
        assert result == [[float(i)] for i in range(total)]

    async def test_embed_propagates_error(self) -> None:
        client, inner = _make_client()
        inner.embeddings.create.side_effect = RuntimeError("boom")
        with pytest.raises(RuntimeError, match="boom"):
            await client.embed(["a"])

    async def test_aclose_closes_underlying_client(self) -> None:
        client, inner = _make_client()
        await client.aclose()
        inner.close.assert_awaited_once()


class TestEmbeddingFingerprint:
    def test_fingerprint_deterministic_and_short(self) -> None:
        first = embeddings_mod._embedding_fingerprint()
        second = embeddings_mod._embedding_fingerprint()
        assert first == second
        assert len(first) == 16

    def test_fingerprint_changes_with_config(self) -> None:
        with patch("infra.llm.embeddings.settings") as mock_settings:
            mock_settings.llm = SimpleNamespace(
                embedding_api_key="a",
                embedding_base_url="b",
                embedding_model="c",
                request_timeout_seconds=1,
            )
            first = embeddings_mod._embedding_fingerprint()
            mock_settings.llm.embedding_model = "different"
            second = embeddings_mod._embedding_fingerprint()
        assert first != second


class TestGetEmbeddingClient:
    def _reset_singleton(self) -> None:
        embeddings_mod._client = None
        embeddings_mod._client_fingerprint = None
        embeddings_mod._client_lock = None

    async def test_creates_and_caches_client(self) -> None:
        self._reset_singleton()
        created: list[MagicMock] = []

        def _factory(**_kwargs: object) -> MagicMock:
            instance = MagicMock()
            instance.aclose = AsyncMock()
            created.append(instance)
            return instance

        with patch("infra.llm.embeddings.EmbeddingClient", side_effect=_factory):
            first = await get_embedding_client()
            second = await get_embedding_client()

        assert first is second
        assert len(created) == 1
        self._reset_singleton()

    async def test_recreates_client_when_fingerprint_changes(self) -> None:
        self._reset_singleton()
        created: list[MagicMock] = []

        def _factory(**_kwargs: object) -> MagicMock:
            instance = MagicMock()
            instance.aclose = AsyncMock()
            created.append(instance)
            return instance

        fingerprints = iter(["fp-1", "fp-2"])
        with (
            patch("infra.llm.embeddings.EmbeddingClient", side_effect=_factory),
            patch(
                "infra.llm.embeddings._embedding_fingerprint",
                side_effect=lambda: next(fingerprints),
            ),
        ):
            first = await get_embedding_client()
            second = await get_embedding_client()

        assert first is not second
        assert len(created) == 2
        created[0].aclose.assert_awaited_once()
        self._reset_singleton()

    def test_get_lock_returns_singleton_lock(self) -> None:
        embeddings_mod._client_lock = None
        lock = embeddings_mod._get_lock()
        assert isinstance(lock, asyncio.Lock)
        assert embeddings_mod._get_lock() is lock
