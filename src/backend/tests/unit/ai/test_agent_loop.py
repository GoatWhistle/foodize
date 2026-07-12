from typing import Any

import pytest

from infra.llm.agent import LLMBudgetExceededError, run_agent, stream_agent
from infra.llm.base import (
    LLMResponse,
    Message,
    Role,
    ToolCall,
    ToolInputError,
    ToolSpec,
    Usage,
)

from .conftest import FakeLLMClient

_TOOLS = [ToolSpec(name="loop", description="d", input_schema={"type": "object"})]


def _tool_response(name: str, args: dict[str, Any], call_id: str = "call-1") -> LLMResponse:
    return LLMResponse(
        text="",
        tool_calls=[ToolCall(id=call_id, name=name, arguments=args)],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )


def _multi_tool_response(names: list[str]) -> LLMResponse:
    return LLMResponse(
        text="",
        tool_calls=[
            ToolCall(id=f"call-{i}", name=name, arguments={}) for i, name in enumerate(names)
        ],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )


def _text_response(text: str) -> LLMResponse:
    return LLMResponse(text=text, tool_calls=[], stop_reason="end_turn", usage=Usage())


@pytest.mark.asyncio
async def test_run_agent_executes_tool_then_returns_final_text() -> None:
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
async def test_run_agent_without_tool_calls_returns_immediately() -> None:
    client = FakeLLMClient([_text_response("hello")])

    async def execute(call: ToolCall) -> str:  # pragma: no cover - must never run
        raise AssertionError("execute should not be called")

    text, _history = await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=[],
        execute=execute,
    )

    assert text == "hello"
    assert len(client.complete_calls) == 1


@pytest.mark.asyncio
async def test_run_agent_hides_internal_tool_errors_from_model() -> None:
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
async def test_run_agent_surfaces_validation_errors_to_model() -> None:
    client = FakeLLMClient([_tool_response("boom", {}), _text_response("recovered")])

    async def execute(call: ToolCall) -> str:
        raise ToolInputError("invalid restaurant_id")

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
async def test_run_agent_forces_final_answer_when_budget_exhausted() -> None:
    looping = [_tool_response("loop", {}) for _ in range(3)]
    final = _text_response("forced final")
    client = FakeLLMClient([*looping, final])

    async def execute(call: ToolCall) -> str:
        return "again"

    text, _ = await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=_TOOLS,
        execute=execute,
        max_steps=3,
    )

    assert text.startswith("forced final")
    assert len(client.complete_calls) == 4
    assert client.complete_calls[-1]["tools"] == _TOOLS
    assert client.complete_calls[-1]["tool_choice"] == "none"


@pytest.mark.asyncio
async def test_run_agent_forced_final_step_counts_against_budget() -> None:
    heavy_final = LLMResponse(
        text="forced",
        tool_calls=[],
        stop_reason="end_turn",
        usage=Usage(input_tokens=60, output_tokens=60),
    )
    client = FakeLLMClient([_tool_response("loop", {}), _tool_response("loop", {}), heavy_final])

    async def execute(call: ToolCall) -> str:
        return "again"

    with pytest.raises(LLMBudgetExceededError):
        await run_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=_TOOLS,
            execute=execute,
            max_steps=2,
            max_tokens=100,
        )


@pytest.mark.asyncio
async def test_stream_agent_forced_final_step_counts_against_budget() -> None:
    heavy_final = LLMResponse(
        text="forced",
        tool_calls=[],
        stop_reason="end_turn",
        usage=Usage(input_tokens=60, output_tokens=60),
    )
    client = FakeLLMClient([_tool_response("loop", {}), _tool_response("loop", {}), heavy_final])

    async def execute(call: ToolCall) -> str:
        return "again"

    with pytest.raises(LLMBudgetExceededError):
        async for _ in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=_TOOLS,
            execute=execute,
            max_steps=2,
            max_tokens=100,
        ):
            pass


@pytest.mark.asyncio
async def test_run_agent_executes_step_tools_sequentially() -> None:
    client = FakeLLMClient([_multi_tool_response(["add", "remove", "clear"]), _text_response("ok")])
    order: list[str] = []

    async def execute(call: ToolCall) -> str:
        order.append(f"start:{call.name}")
        order.append(f"end:{call.name}")
        return "{}"

    await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=_TOOLS,
        execute=execute,
    )

    assert order == [
        "start:add",
        "end:add",
        "start:remove",
        "end:remove",
        "start:clear",
        "end:clear",
    ]


@pytest.mark.asyncio
async def test_run_agent_raises_when_token_budget_exceeded() -> None:
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
async def test_stream_agent_streams_deltas_with_single_generation_per_step() -> None:
    client = FakeLLMClient([_tool_response("search", {"q": "x"}), _text_response("Привет")])
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
    assert len(chunks) > 1  # настоящие дельты, а не один целый кусок
    assert executed == ["search"]
    assert len(client.stream_calls) == 2  # ровно одна генерация на шаг
    assert len(client.complete_calls) == 0


@pytest.mark.asyncio
async def test_stream_agent_streams_interstitial_text_before_tools() -> None:
    thinking = LLMResponse(
        text="Сейчас поищу. ",
        tool_calls=[ToolCall(id="call-1", name="search", arguments={})],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )
    client = FakeLLMClient([thinking, _text_response("Готово")])

    async def execute(call: ToolCall) -> str:
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=_TOOLS,
            execute=execute,
        )
    ]

    assert "".join(chunks) == "Сейчас поищу. Готово"


@pytest.mark.asyncio
async def test_stream_agent_appends_truncated_notice() -> None:
    truncated = LLMResponse(text="обрыв", tool_calls=[], stop_reason="max_tokens", usage=Usage())
    client = FakeLLMClient([truncated])

    async def execute(call: ToolCall) -> str:  # pragma: no cover - must never run
        raise AssertionError("execute should not be called")

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

    joined = "".join(chunks)
    assert joined.startswith("обрыв")
    assert "обрезан" in joined


@pytest.mark.asyncio
async def test_stream_agent_forces_final_answer_when_step_budget_exhausted() -> None:
    client = FakeLLMClient(
        [*(_tool_response("loop", {}) for _ in range(2)), _text_response("Привет")]
    )

    async def execute(call: ToolCall) -> str:
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=_TOOLS,
            execute=execute,
            max_steps=2,
        )
    ]

    assert "".join(chunks) == "Привет"
    assert len(client.stream_calls) == 3
    assert client.stream_calls[-1]["tools"] == _TOOLS
    assert client.stream_calls[-1]["tool_choice"] == "none"


@pytest.mark.asyncio
async def test_stream_agent_notices_when_exhausted_final_answer_is_empty() -> None:
    client = FakeLLMClient([*(_tool_response("loop", {}) for _ in range(2)), _text_response("")])

    async def execute(call: ToolCall) -> str:
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=_TOOLS,
            execute=execute,
            max_steps=2,
        )
    ]

    assert len(chunks) == 1
    assert "число шагов" in chunks[0]


@pytest.mark.asyncio
async def test_stream_agent_raises_when_token_budget_exceeded() -> None:
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
        async for _ in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=_TOOLS,
            execute=execute,
            max_steps=8,
            max_tokens=100,
        ):
            pass
