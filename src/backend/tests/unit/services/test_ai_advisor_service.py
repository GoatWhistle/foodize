import uuid
from collections.abc import AsyncIterator
from unittest.mock import MagicMock, patch

import pytest

from features.ai_advisor.schemas import ChatMessageIn
from features.ai_advisor.service import generate_insights, stream_chat, to_messages
from infra.llm import Role, ToolCall, ToolExecutor
from infra.llm.base import (
    LLMClient,
    LLMResponse,
    Message,
    StreamEvent,
    TextDelta,
    ToolSpec,
    Usage,
)


class FakeLLMClient(LLMClient):
    def __init__(self, text: str, delta_size: int = 6, fail: bool = False) -> None:
        self._text = text
        self._delta_size = delta_size
        self._fail = fail

    @property
    def model(self) -> str:
        return "fake-model"

    async def complete(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> LLMResponse:
        del system, messages, tools, tool_choice
        if self._fail:
            raise RuntimeError("fail")
        return LLMResponse(text=self._text, tool_calls=[], stop_reason="end_turn", usage=Usage())

    async def stream(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> AsyncIterator[StreamEvent]:
        del system, messages, tools, tool_choice
        if self._fail:
            raise RuntimeError("fail")
        for start in range(0, len(self._text), self._delta_size):
            yield TextDelta(self._text[start : start + self._delta_size])
        yield LLMResponse(text=self._text, tool_calls=[], stop_reason="end_turn", usage=Usage())

    async def aclose(self) -> None:
        return None


def _make_vendor() -> MagicMock:
    vendor = MagicMock()
    vendor.id = uuid.uuid4()
    return vendor


class TestToMessages:
    def test_empty(self) -> None:
        assert to_messages([]) == []

    def test_user_message(self) -> None:
        msg = ChatMessageIn(role="user", content="Привет")
        result = to_messages([msg])
        assert len(result) == 1
        assert result[0].role == Role.USER
        assert result[0].content == "Привет"

    def test_assistant_message(self) -> None:
        msg = ChatMessageIn(role="assistant", content="Добрый день")
        result = to_messages([msg])
        assert result[0].role == Role.ASSISTANT

    def test_multiple_messages(self) -> None:
        msgs = [
            ChatMessageIn(role="user", content="Привет"),
            ChatMessageIn(role="assistant", content="Ответ"),
            ChatMessageIn(role="user", content="Ещё"),
        ]
        result = to_messages(msgs)
        assert len(result) == 3
        assert result[0].role == Role.USER
        assert result[1].role == Role.ASSISTANT


class TestStreamChat:
    async def test_yields_chunks(self) -> None:
        vendor = _make_vendor()
        history = [ChatMessageIn(role="user", content="Анализ")]
        client = FakeLLMClient("chunk1chunk2", delta_size=6)

        async def _fake_get_client(*_args: object, **_kwargs: object) -> FakeLLMClient:
            return client

        with patch("features.ai_advisor.service.get_llm_client", side_effect=_fake_get_client):
            chunks = [chunk async for chunk in stream_chat(vendor, history)]

        assert "".join(chunks) == "chunk1chunk2"

    async def test_yields_error_message_on_exception(self) -> None:
        vendor = _make_vendor()
        history = [ChatMessageIn(role="user", content="Анализ")]
        client = FakeLLMClient("", fail=True)

        async def _fake_get_client(*_args: object, **_kwargs: object) -> FakeLLMClient:
            return client

        with patch("features.ai_advisor.service.get_llm_client", side_effect=_fake_get_client):
            chunks = [chunk async for chunk in stream_chat(vendor, history)]

        assert len(chunks) == 1
        assert "ошибка" in chunks[0].lower() or "Извините" in chunks[0]

    async def test_passes_restaurant_id(self) -> None:
        vendor = _make_vendor()
        history = [ChatMessageIn(role="user", content="Что")]
        rid = uuid.uuid4()
        client = FakeLLMClient("ok")

        captured: dict[str, object] = {}

        def _fake_executor(
            _v: MagicMock,
            default_restaurant_id: uuid.UUID | None = None,
            language: str = "ru",
        ) -> ToolExecutor:
            del language
            captured["rid"] = default_restaurant_id

            async def _execute(_call: ToolCall) -> str:
                return "{}"

            return _execute

        async def _fake_get_client(*_args: object, **_kwargs: object) -> FakeLLMClient:
            return client

        with (
            patch("features.ai_advisor.service.get_llm_client", side_effect=_fake_get_client),
            patch("features.ai_advisor.service.build_advisor_executor", side_effect=_fake_executor),
        ):
            async for _ in stream_chat(vendor, history, restaurant_id=rid):
                pass

        assert captured["rid"] == rid


class TestGenerateInsights:
    async def test_returns_text(self) -> None:
        vendor = _make_vendor()
        client = FakeLLMClient("Отчёт готов")

        async def _fake_get_client(*_args: object, **_kwargs: object) -> FakeLLMClient:
            return client

        with patch("features.ai_advisor.service.get_llm_client", side_effect=_fake_get_client):
            result = await generate_insights(vendor)

        assert result == "Отчёт готов"

    async def test_reraises_exception(self) -> None:
        vendor = _make_vendor()
        client = FakeLLMClient("", fail=True)

        async def _fake_get_client(*_args: object, **_kwargs: object) -> FakeLLMClient:
            return client

        with (
            patch("features.ai_advisor.service.get_llm_client", side_effect=_fake_get_client),
            pytest.raises(RuntimeError, match="fail"),
        ):
            await generate_insights(vendor)
