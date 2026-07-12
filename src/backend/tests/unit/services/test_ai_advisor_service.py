import uuid
from collections.abc import AsyncIterator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from features.ai_advisor.schemas import ChatMessageIn
from features.ai_advisor.service import _to_messages, generate_insights, stream_chat
from infra.llm import Role


class TestToMessages:
    def test_empty(self) -> None:
        assert _to_messages([]) == []

    def test_user_message(self) -> None:
        msg = ChatMessageIn(role="user", content="Привет")
        result = _to_messages([msg])
        assert len(result) == 1
        assert result[0].role == Role.USER
        assert result[0].content == "Привет"

    def test_assistant_message(self) -> None:
        msg = ChatMessageIn(role="assistant", content="Добрый день")
        result = _to_messages([msg])
        assert result[0].role == Role.ASSISTANT

    def test_multiple_messages(self) -> None:
        msgs = [
            ChatMessageIn(role="user", content="Привет"),
            ChatMessageIn(role="assistant", content="Ответ"),
            ChatMessageIn(role="user", content="Ещё"),
        ]
        result = _to_messages(msgs)
        assert len(result) == 3
        assert result[0].role == Role.USER
        assert result[1].role == Role.ASSISTANT


def _make_vendor() -> MagicMock:
    vendor = MagicMock()
    vendor.id = uuid.uuid4()
    return vendor


class TestStreamChat:
    @pytest.mark.asyncio
    async def test_yields_chunks(self) -> None:
        vendor = _make_vendor()
        history = [ChatMessageIn(role="user", content="Анализ")]

        async def _fake_stream(*args: Any, **kwargs: Any) -> AsyncIterator[str]:
            yield "chunk1"
            yield "chunk2"

        with (
            patch("features.ai_advisor.service.get_llm_client", new_callable=AsyncMock),
            patch("features.ai_advisor.service.build_advisor_executor", return_value=AsyncMock()),
            patch("features.ai_advisor.service.stream_agent", side_effect=_fake_stream),
        ):
            chunks: list[str] = []
            async for chunk in stream_chat(vendor, history):
                chunks.append(chunk)

        assert chunks == ["chunk1", "chunk2"]

    @pytest.mark.asyncio
    async def test_yields_error_message_on_exception(self) -> None:
        vendor = _make_vendor()
        history = [ChatMessageIn(role="user", content="Анализ")]

        with (
            patch("features.ai_advisor.service.get_llm_client", new_callable=AsyncMock),
            patch("features.ai_advisor.service.build_advisor_executor", return_value=AsyncMock()),
            patch("features.ai_advisor.service.stream_agent", side_effect=RuntimeError("fail")),
        ):
            chunks: list[str] = []
            async for chunk in stream_chat(vendor, history):
                chunks.append(chunk)

        assert len(chunks) == 1
        assert "ошибка" in chunks[0].lower() or "Извините" in chunks[0]

    @pytest.mark.asyncio
    async def test_passes_restaurant_id(self) -> None:
        vendor = _make_vendor()
        history = [ChatMessageIn(role="user", content="Что")]
        rid = uuid.uuid4()

        async def _fake_stream(*args: Any, **kwargs: Any) -> AsyncIterator[str]:
            yield "ok"

        captured: dict[str, Any] = {}

        def _fake_executor(
            vendor: MagicMock, default_restaurant_id: uuid.UUID | None = None
        ) -> AsyncMock:
            captured["rid"] = default_restaurant_id
            return AsyncMock()

        with (
            patch("features.ai_advisor.service.get_llm_client", new_callable=AsyncMock),
            patch("features.ai_advisor.service.build_advisor_executor", side_effect=_fake_executor),
            patch("features.ai_advisor.service.stream_agent", side_effect=_fake_stream),
        ):
            async for _ in stream_chat(vendor, history, restaurant_id=rid):
                pass

        assert captured["rid"] == rid


class TestGenerateInsights:
    @pytest.mark.asyncio
    async def test_returns_text(self) -> None:
        vendor = _make_vendor()

        with (
            patch("features.ai_advisor.service.get_llm_client", new_callable=AsyncMock),
            patch("features.ai_advisor.service.build_advisor_executor", return_value=AsyncMock()),
            patch(
                "features.ai_advisor.service.run_agent",
                new_callable=AsyncMock,
                return_value=("Отчёт готов", []),
            ),
        ):
            result = await generate_insights(vendor)

        assert result == "Отчёт готов"

    @pytest.mark.asyncio
    async def test_reraises_exception(self) -> None:
        vendor = _make_vendor()

        with (
            patch("features.ai_advisor.service.get_llm_client", new_callable=AsyncMock),
            patch("features.ai_advisor.service.build_advisor_executor", return_value=AsyncMock()),
            patch(
                "features.ai_advisor.service.run_agent",
                new_callable=AsyncMock,
                side_effect=ValueError("db error"),
            ),
        ):
            with pytest.raises(ValueError, match="db error"):
                await generate_insights(vendor)
