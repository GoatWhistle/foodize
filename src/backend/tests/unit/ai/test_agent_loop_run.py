import pytest

from infra.llm.agent import run_agent
from infra.llm.agent_run import LLMBudgetExceededError
from infra.llm.base import Message, Role, ToolCall, ToolInputError

from .agent_responses import (
    LOOP_TOOLS,
    heavy_text_response,
    heavy_tool_response,
    multi_tool_response,
    text_response,
    tool_response,
)
from .conftest import FakeLLMClient


async def test_run_agent_executes_tool_then_returns_final_text() -> None:
    client = FakeLLMClient([tool_response("search", {"q": "pizza"}), text_response("done")])
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


async def test_run_agent_without_tool_calls_returns_immediately() -> None:
    client = FakeLLMClient([text_response("hello")])

    async def execute(_call: ToolCall) -> str:  # pragma: no cover
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


async def test_run_agent_hides_internal_tool_errors_from_model() -> None:
    client = FakeLLMClient([tool_response("boom", {}), text_response("recovered")])

    async def execute(_call: ToolCall) -> str:
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


async def test_run_agent_surfaces_validation_errors_to_model() -> None:
    client = FakeLLMClient([tool_response("boom", {}), text_response("recovered")])

    async def execute(_call: ToolCall) -> str:
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


async def test_run_agent_forces_final_answer_when_budget_exhausted() -> None:
    looping = [tool_response("loop", {}) for _ in range(3)]
    final = text_response("forced final")
    client = FakeLLMClient([*looping, final])

    async def execute(_call: ToolCall) -> str:
        return "again"

    text, _ = await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=LOOP_TOOLS,
        execute=execute,
        max_steps=3,
    )

    assert text.startswith("forced final")
    assert len(client.complete_calls) == 4
    assert client.complete_calls[-1]["tools"] == LOOP_TOOLS
    assert client.complete_calls[-1]["tool_choice"] == "none"


async def test_run_agent_forced_final_step_counts_against_budget() -> None:
    client = FakeLLMClient(
        [tool_response("loop", {}), tool_response("loop", {}), heavy_text_response("forced")]
    )

    async def execute(_call: ToolCall) -> str:
        return "again"

    with pytest.raises(LLMBudgetExceededError):
        await run_agent(
            client,
            system="s",
            messages=[Message(role=Role.USER, content="hi")],
            tools=LOOP_TOOLS,
            execute=execute,
            max_steps=2,
            max_tokens=100,
        )


async def test_run_agent_executes_step_tools_sequentially() -> None:
    client = FakeLLMClient([multi_tool_response(["add", "remove", "clear"]), text_response("ok")])
    order: list[str] = []

    async def execute(call: ToolCall) -> str:
        order.append(f"start:{call.name}")
        order.append(f"end:{call.name}")
        return "{}"

    await run_agent(
        client,
        system="s",
        messages=[Message(role=Role.USER, content="hi")],
        tools=LOOP_TOOLS,
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


async def test_run_agent_raises_when_token_budget_exceeded() -> None:
    client = FakeLLMClient([heavy_tool_response(), heavy_tool_response(), heavy_tool_response()])

    async def execute(_call: ToolCall) -> str:
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
