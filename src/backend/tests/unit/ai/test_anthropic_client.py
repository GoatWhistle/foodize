from collections.abc import AsyncIterator
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from pydantic import JsonValue

from infra.llm.anthropic_client import AnthropicClient, parse_message, to_tools
from infra.llm.base import (
    LLMResponse,
    Message,
    Role,
    TextDelta,
    ToolCall,
    ToolSpec,
    ToolUseStart,
)


def _make_client(inner: MagicMock | None = None) -> AnthropicClient:
    with patch("anthropic.AsyncAnthropic") as fake:
        fake.return_value = inner if inner is not None else MagicMock()
        return AnthropicClient(api_key="k", model="claude-x", max_tokens=100, timeout=5)


def _client_with_messages(create: object = None, stream: object = None) -> AnthropicClient:
    inner = MagicMock()
    inner.messages = SimpleNamespace(create=create, stream=stream)
    return _make_client(inner)


def _client_with_close(close: object) -> AnthropicClient:
    inner = MagicMock()
    inner.close = close
    return _make_client(inner)


def _text_block(text: str) -> SimpleNamespace:
    return SimpleNamespace(type="text", text=text)


def _tool_block(block_id: str, name: str, payload: dict[str, JsonValue] | None) -> SimpleNamespace:
    return SimpleNamespace(type="tool_use", id=block_id, name=name, input=payload)


def _response(
    blocks: list[SimpleNamespace],
    stop_reason: str | None = "end_turn",
    input_tokens: int = 3,
    output_tokens: int = 7,
) -> SimpleNamespace:
    return SimpleNamespace(
        content=blocks,
        stop_reason=stop_reason,
        usage=SimpleNamespace(input_tokens=input_tokens, output_tokens=output_tokens),
    )


class TestToTools:
    def test_maps_tool_specs(self) -> None:
        spec = ToolSpec(name="search", description="d", input_schema={"type": "object"})
        assert to_tools([spec]) == [
            {"name": "search", "description": "d", "input_schema": {"type": "object"}}
        ]


class TestParseMessage:
    def test_text_only(self) -> None:
        result = parse_message(_response([_text_block("Привет"), _text_block(" мир")]))
        assert result.text == "Привет мир"
        assert result.tool_calls == []
        assert result.stop_reason == "end_turn"
        assert result.usage.input_tokens == 3
        assert result.usage.output_tokens == 7

    def test_tool_use_block(self) -> None:
        result = parse_message(
            _response([_tool_block("t1", "search", {"q": "pizza"})], stop_reason="tool_use")
        )
        assert result.text == ""
        assert result.tool_calls == [ToolCall(id="t1", name="search", arguments={"q": "pizza"})]
        assert result.stop_reason == "tool_use"

    def test_tool_use_with_none_input(self) -> None:
        result = parse_message(_response([_tool_block("t1", "noop", None)]))
        assert result.tool_calls[0].arguments == {}

    def test_missing_stop_reason_becomes_empty(self) -> None:
        result = parse_message(_response([_text_block("x")], stop_reason=None))
        assert result.stop_reason == ""


class TestRequestKwargs:
    def test_includes_tools_and_tool_choice(self) -> None:
        client = _make_client()
        spec = ToolSpec(name="s", description="d", input_schema={"type": "object"})
        kwargs = client._request_kwargs(
            "system", [Message(role=Role.USER, content="hi")], [spec], "any"
        )
        assert kwargs["model"] == "claude-x"
        assert kwargs["max_tokens"] == 100
        assert kwargs["system"] == "system"
        assert kwargs["messages"] == [{"role": "user", "content": "hi"}]
        assert kwargs["tools"][0]["name"] == "s"
        assert kwargs["tool_choice"] == {"type": "any"}

    def test_omits_tools_and_tool_choice_when_absent(self) -> None:
        client = _make_client()
        kwargs = client._request_kwargs("system", [], None, None)
        assert "tools" not in kwargs
        assert "tool_choice" not in kwargs


class TestModelProperty:
    def test_model(self) -> None:
        assert _make_client().model == "claude-x"


class TestComplete:
    async def test_complete_parses_response(self) -> None:
        create = AsyncMock(return_value=_response([_text_block("готово")]))
        client = _client_with_messages(create=create)
        result = await client.complete(system="s", messages=[Message(role=Role.USER, content="q")])
        assert isinstance(result, LLMResponse)
        assert result.text == "готово"
        assert create.await_args is not None
        assert create.await_args.kwargs["model"] == "claude-x"

    async def test_complete_passes_tools(self) -> None:
        create = AsyncMock(
            return_value=_response([_tool_block("t1", "search", {})], stop_reason="tool_use")
        )
        client = _client_with_messages(create=create)
        spec = ToolSpec(name="search", description="d", input_schema={"type": "object"})
        await client.complete(
            system="s", messages=[Message(role=Role.USER, content="q")], tools=[spec]
        )
        assert create.await_args is not None
        assert create.await_args.kwargs["tools"][0]["name"] == "search"

    async def test_complete_propagates_error(self) -> None:
        create = AsyncMock(side_effect=RuntimeError("api down"))
        client = _client_with_messages(create=create)
        with pytest.raises(RuntimeError, match="api down"):
            await client.complete(system="s", messages=[])


class _FakeStream:
    def __init__(self, events: list[SimpleNamespace], final: SimpleNamespace) -> None:
        self._events = events
        self._final = final

    async def __aenter__(self) -> "_FakeStream":
        return self

    async def __aexit__(self, *args: object) -> bool:
        return False

    def __aiter__(self) -> AsyncIterator[SimpleNamespace]:
        async def _gen() -> AsyncIterator[SimpleNamespace]:
            for event in self._events:
                yield event

        return _gen()

    async def get_final_message(self) -> SimpleNamespace:
        return self._final


def _text_event(text: str) -> SimpleNamespace:
    return SimpleNamespace(type="text", text=text)


def _tool_start_event(name: str) -> SimpleNamespace:
    return SimpleNamespace(
        type="content_block_start",
        content_block=SimpleNamespace(type="tool_use", name=name),
    )


def _ignored_event() -> SimpleNamespace:
    return SimpleNamespace(
        type="content_block_start",
        content_block=SimpleNamespace(type="text"),
    )


class TestStream:
    async def test_stream_yields_text_tool_start_and_final(self) -> None:
        events = [
            _text_event("Ищу"),
            _text_event(" блюдо"),
            _tool_start_event("search"),
            _ignored_event(),
        ]
        final = _response([_tool_block("t1", "search", {"q": "pizza"})], stop_reason="tool_use")
        fake_stream = _FakeStream(events, final)
        client = _client_with_messages(stream=MagicMock(return_value=fake_stream))

        collected = [event async for event in client.stream(system="s", messages=[])]

        deltas = [event.text for event in collected if isinstance(event, TextDelta)]
        starts = [event for event in collected if isinstance(event, ToolUseStart)]
        final_event = collected[-1]
        assert deltas == ["Ищу", " блюдо"]
        assert starts == [ToolUseStart(name="search")]
        assert isinstance(final_event, LLMResponse)
        assert final_event.tool_calls[0].name == "search"

    async def test_stream_empty_produces_only_final(self) -> None:
        final = _response([_text_block("ответ")])
        fake_stream = _FakeStream([], final)
        client = _client_with_messages(stream=MagicMock(return_value=fake_stream))

        collected = [event async for event in client.stream(system="s", messages=[])]

        assert len(collected) == 1
        assert isinstance(collected[0], LLMResponse)
        assert collected[0].text == "ответ"


class TestAclose:
    async def test_aclose_closes_client(self) -> None:
        close = AsyncMock()
        client = _client_with_close(close)
        await client.aclose()
        close.assert_awaited_once()
