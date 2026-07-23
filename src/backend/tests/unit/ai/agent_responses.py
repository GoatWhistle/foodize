from pydantic import JsonValue

from infra.llm.base import LLMResponse, ToolCall, ToolSpec, Usage

LOOP_TOOLS = [ToolSpec(name="loop", description="d", input_schema={"type": "object"})]


def tool_response(name: str, args: dict[str, JsonValue], call_id: str = "call-1") -> LLMResponse:
    return LLMResponse(
        text="",
        tool_calls=[ToolCall(id=call_id, name=name, arguments=args)],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )


def multi_tool_response(names: list[str]) -> LLMResponse:
    return LLMResponse(
        text="",
        tool_calls=[
            ToolCall(id=f"call-{i}", name=name, arguments={}) for i, name in enumerate(names)
        ],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )


def text_tool_response(text: str, name: str, call_id: str = "call-1") -> LLMResponse:
    return LLMResponse(
        text=text,
        tool_calls=[ToolCall(id=call_id, name=name, arguments={})],
        stop_reason="tool_use",
        usage=Usage(input_tokens=1, output_tokens=1),
    )


def text_response(text: str) -> LLMResponse:
    return LLMResponse(text=text, tool_calls=[], stop_reason="end_turn", usage=Usage())


def heavy_tool_response() -> LLMResponse:
    return LLMResponse(
        text="",
        tool_calls=[ToolCall(id="c", name="loop", arguments={})],
        stop_reason="tool_use",
        usage=Usage(input_tokens=60, output_tokens=60),
    )


def heavy_text_response(text: str) -> LLMResponse:
    return LLMResponse(
        text=text,
        tool_calls=[],
        stop_reason="end_turn",
        usage=Usage(input_tokens=60, output_tokens=60),
    )
