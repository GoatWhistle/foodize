"""Tests for the shared tool-calling agent loop (``infra/llm/agent.py``)."""

import pytest

from infra.llm.agent import LLMBudgetExceededError, run_agent, stream_agent
from infra.llm.base import LLMResponse, Message, Role, ToolCall, Usage

from .conftest import FakeLLMClient


def _tool_response(name: str, args: dict) -> LLMResponse:
    return LLMResponse(
        text="",
        tool_calls=[ToolCall(id="call-1", name=name, arguments=args)],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )


def _text_response(text: str) -> LLMResponse:
    return LLMResponse(text=text, tool_calls=[], stop_reason="end_turn", usage=Usage())


@pytest.mark.asyncio
async def test_run_agent_executes_tool_then_returns_final_text():
    client = FakeLLMClient([_tool_response("search", {"q": "pizza"}), _text_response("done")])
    executed: list[ToolCall] = []

    async def execute(call: ToolCall) -> str:
        executed.append(call)
        return "tool-result"

    text, history = await run_agent(
        client,
        system="sys",
        messages=[Message(role=Role.USER, content="hi")],
        tools=[],
        execute=execute,
    )

    assert text == "done"
    assert [c.name for c in executed] == ["search"]
    assert [m.role for m in history] == [Role.USER, Role.ASSISTANT, Role.TOOL, Role.ASSISTANT]
    tool_msg = history[2]
    assert tool_msg.content == "tool-result"
    assert tool_msg.tool_call_id == "call-1"


@pytest.mark.asyncio
async def test_run_agent_without_tool_calls_returns_immediately():
    client = FakeLLMClient([_text_response("hello")])

    async def execute(call: ToolCall) -> str:  # pragma: no cover - must never run
        raise AssertionError("execute should not be called")

    text, history = await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=[],
        execute=execute,
    )

    assert text == "hello"
    assert len(client.complete_calls) == 1


@pytest.mark.asyncio
async def test_run_agent_hides_internal_tool_errors_from_model():
    client = FakeLLMClient([_tool_response("boom", {}), _text_response("recovered")])

    async def execute(call: ToolCall) -> str:
        raise RuntimeError("kaboom secret detail")

    text, history = await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=[],
        execute=execute,
    )

    tool_msg = next(m for m in history if m.role == Role.TOOL)
    assert "Error while running tool 'boom'" in tool_msg.content
    assert "internal error" in tool_msg.content
    assert "kaboom" not in tool_msg.content
    assert text == "recovered"


@pytest.mark.asyncio
async def test_run_agent_surfaces_validation_errors_to_model():
    client = FakeLLMClient([_tool_response("boom", {}), _text_response("recovered")])

    async def execute(call: ToolCall) -> str:
        raise ValueError("invalid restaurant_id")

    text, history = await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=[],
        execute=execute,
    )

    tool_msg = next(m for m in history if m.role == Role.TOOL)
    assert "invalid restaurant_id" in tool_msg.content
    assert text == "recovered"


@pytest.mark.asyncio
async def test_run_agent_forces_final_answer_when_budget_exhausted():
    looping = [_tool_response("loop", {}) for _ in range(3)]
    final = _text_response("forced final")
    client = FakeLLMClient([*looping, final])

    async def execute(call: ToolCall) -> str:
        return "again"

    text, _ = await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=[],
        execute=execute,
        max_steps=3,
    )

    assert text == "forced final"
    assert len(client.complete_calls) == 4
    assert client.complete_calls[-1]["tools"] is None


@pytest.mark.asyncio
async def test_run_agent_raises_when_token_budget_exceeded():
    heavy = LLMResponse(
        text="",
        tool_calls=[ToolCall(id="c", name="loop", arguments={})],
        stop_reason="tool_use",
        usage=Usage(input_tokens=60, output_tokens=60),
    )
    client = FakeLLMClient([heavy, heavy, heavy])

    async def execute(call: ToolCall) -> str:
        return "again"

    with pytest.raises(LLMBudgetExceededError):
        await run_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=[],
            execute=execute,
            max_steps=8,
            max_tokens=100,
        )


@pytest.mark.asyncio
async def test_stream_agent_resolves_tools_then_yields_final_text_once():
    client = FakeLLMClient(
        [_tool_response("search", {"q": "x"}), _text_response("Привет")],
        stream_chunks=["should", "-not-run"],
    )
    executed: list[str] = []

    async def execute(call: ToolCall) -> str:
        executed.append(call.name)
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=[],
            execute=execute,
        )
    ]

    assert "".join(chunks) == "Привет"
    assert executed == ["search"]
    assert len(client.stream_calls) == 0
    assert len(client.complete_calls) == 2


@pytest.mark.asyncio
async def test_stream_agent_streams_only_when_step_budget_exhausted():
    client = FakeLLMClient(
        [_tool_response("loop", {}) for _ in range(2)],
        stream_chunks=["Пр", "ивет"],
    )

    async def execute(call: ToolCall) -> str:
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=[],
            execute=execute,
            max_steps=2,
        )
    ]

    assert "".join(chunks) == "Привет"
    assert len(client.complete_calls) == 2
    assert len(client.stream_calls) == 1
