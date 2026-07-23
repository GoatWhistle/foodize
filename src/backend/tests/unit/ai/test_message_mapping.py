from anthropic.types import MessageParam
from openai.types.chat import ChatCompletionMessageParam

from infra.llm.anthropic_client import to_messages as anthropic_messages
from infra.llm.base import Message, Role, ToolCall
from infra.llm.openai_mapping import to_messages as openai_messages


def _blocks(message: MessageParam) -> list[dict[str, object]]:
    content = message["content"]
    assert not isinstance(content, str)
    blocks = list(content)
    for block in blocks:
        assert isinstance(block, dict)
    return [dict(block) for block in blocks]


def _tool_calls(message: ChatCompletionMessageParam) -> list[dict[str, object]]:
    assert message["role"] == "assistant"
    raw = message.get("tool_calls")
    assert raw is not None
    return [dict(call) for call in raw]


def _conversation() -> list[Message]:
    return [
        Message(role=Role.USER, content="найди пиццу"),
        Message(
            role=Role.ASSISTANT,
            content="ищу",
            tool_calls=[ToolCall(id="t1", name="search", arguments={"q": "pizza"})],
        ),
        Message(role=Role.TOOL, content='{"results": []}', tool_call_id="t1", tool_name="search"),
    ]


def test_anthropic_merges_parallel_tool_results_into_one_user_turn() -> None:
    messages = [
        Message(
            role=Role.ASSISTANT,
            tool_calls=[
                ToolCall(id="a", name="x", arguments={}),
                ToolCall(id="b", name="y", arguments={}),
            ],
        ),
        Message(role=Role.TOOL, content="ra", tool_call_id="a", tool_name="x"),
        Message(role=Role.TOOL, content="rb", tool_call_id="b", tool_name="y"),
    ]

    out = anthropic_messages(messages)

    assert out[0]["role"] == "assistant"
    assert [b["type"] for b in _blocks(out[0])] == ["tool_use", "tool_use"]
    assert out[1]["role"] == "user"
    assert [b["type"] for b in _blocks(out[1])] == ["tool_result", "tool_result"]
    assert {b["tool_use_id"] for b in _blocks(out[1])} == {"a", "b"}


def test_anthropic_assistant_text_and_tool_use_in_one_turn() -> None:
    out = anthropic_messages(_conversation())

    assert out[0] == {"role": "user", "content": "найди пиццу"}
    assistant = out[1]
    assert assistant["role"] == "assistant"
    blocks = _blocks(assistant)
    assert blocks[0] == {"type": "text", "text": "ищу"}
    assert blocks[1]["type"] == "tool_use"
    assert blocks[1]["name"] == "search"


def test_openai_prepends_system_and_uses_tool_role() -> None:
    out = openai_messages("you are a bot", _conversation())

    assert out[0] == {"role": "system", "content": "you are a bot"}
    assert out[1] == {"role": "user", "content": "найди пиццу"}

    calls = _tool_calls(out[2])
    assert calls[0]["id"] == "t1"
    function = calls[0]["function"]
    assert isinstance(function, dict)
    assert function["name"] == "search"

    tool = out[3]
    assert tool["role"] == "tool"
    assert tool["tool_call_id"] == "t1"


def test_openai_serializes_tool_arguments_as_json_without_ascii_escaping() -> None:
    messages = [
        Message(
            role=Role.ASSISTANT,
            tool_calls=[ToolCall(id="t1", name="search", arguments={"q": "пицца"})],
        ),
    ]

    out = openai_messages("sys", messages)

    function = _tool_calls(out[1])[0]["function"]
    assert isinstance(function, dict)
    raw_args = function["arguments"]
    assert isinstance(raw_args, str)
    assert "пицца" in raw_args
