import pytest

from infra.llm.agent import stream_agent
from infra.llm.agent_run import LLMBudgetExceededError
from infra.llm.base import LLMResponse, Message, Role, ToolCall, Usage

from .agent_responses import (
    LOOP_TOOLS,
    heavy_text_response,
    heavy_tool_response,
    text_response,
    text_tool_response,
    tool_response,
)
from .conftest import FakeLLMClient


async def test_stream_agent_forced_final_step_counts_against_budget() -> None:
    client = FakeLLMClient(
        [tool_response("loop", {}), tool_response("loop", {}), heavy_text_response("forced")]
    )

    async def execute(_call: ToolCall) -> str:
        return "again"

    with pytest.raises(LLMBudgetExceededError):
        async for _ in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=LOOP_TOOLS,
            execute=execute,
            max_steps=2,
            max_tokens=100,
        ):
            pass


async def test_stream_agent_streams_deltas_with_single_generation_per_step() -> None:
    client = FakeLLMClient([tool_response("search", {"q": "x"}), text_response("Привет")])
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

    assert chunks == ["Пр", "ив", "ет"]
    assert executed == ["search"]
    assert len(client.stream_calls) == 2
    assert len(client.complete_calls) == 0


async def test_stream_agent_emits_text_incrementally_without_tools() -> None:
    client = FakeLLMClient([text_response("Привет, мир!")], delta_size=3)

    async def execute(_call: ToolCall) -> str:  # pragma: no cover
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

    assert chunks == ["При", "вет", ", м", "ир!"]
    assert len(client.stream_calls) == 1


async def test_stream_agent_buffers_text_once_tool_use_detected() -> None:
    client = FakeLLMClient(
        [text_tool_response("Сейчас поищу. ", "search"), text_response("Готово")],
        tool_use_before_text=True,
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
            tools=LOOP_TOOLS,
            execute=execute,
        )
    ]

    assert chunks[0] == "Сейчас поищу. "
    assert chunks[1:] == ["Го", "то", "во"]
    assert executed == ["search"]


async def test_stream_agent_streams_interstitial_text_before_tools() -> None:
    thinking = LLMResponse(
        text="Сейчас поищу. ",
        tool_calls=[ToolCall(id="call-1", name="search", arguments={})],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )
    client = FakeLLMClient([thinking, text_response("Готово")])

    async def execute(_call: ToolCall) -> str:
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=LOOP_TOOLS,
            execute=execute,
        )
    ]

    assert "".join(chunks) == "Сейчас поищу. Готово"


async def test_stream_agent_appends_truncated_notice() -> None:
    truncated = LLMResponse(text="обрыв", tool_calls=[], stop_reason="max_tokens", usage=Usage())
    client = FakeLLMClient([truncated])

    async def execute(_call: ToolCall) -> str:  # pragma: no cover
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


async def test_stream_agent_forces_final_answer_when_step_budget_exhausted() -> None:
    client = FakeLLMClient(
        [*(tool_response("loop", {}) for _ in range(2)), text_response("Привет")]
    )

    async def execute(_call: ToolCall) -> str:
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=LOOP_TOOLS,
            execute=execute,
            max_steps=2,
        )
    ]

    assert "".join(chunks) == "Привет"
    assert len(client.stream_calls) == 3
    assert client.stream_calls[-1]["tools"] == LOOP_TOOLS
    assert client.stream_calls[-1]["tool_choice"] == "none"


async def test_stream_agent_notices_when_exhausted_final_answer_is_empty() -> None:
    client = FakeLLMClient([*(tool_response("loop", {}) for _ in range(2)), text_response("")])

    async def execute(_call: ToolCall) -> str:
        return "{}"

    chunks = [
        chunk
        async for chunk in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=LOOP_TOOLS,
            execute=execute,
            max_steps=2,
        )
    ]

    assert len(chunks) == 1
    assert "число шагов" in chunks[0]


async def test_stream_agent_raises_when_token_budget_exceeded() -> None:
    client = FakeLLMClient([heavy_tool_response(), heavy_tool_response(), heavy_tool_response()])

    async def execute(_call: ToolCall) -> str:
        return "again"

    with pytest.raises(LLMBudgetExceededError):
        async for _ in stream_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=LOOP_TOOLS,
            execute=execute,
            max_steps=8,
            max_tokens=100,
        ):
            pass
