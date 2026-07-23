from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, NotRequired, TypedDict

from pydantic import JsonValue, TypeAdapter, ValidationError

from infra.llm.base import (
    JsonObject,
    LLMClient,
    LLMResponse,
    Message,
    Role,
    StreamEvent,
    TextDelta,
    ToolCall,
    ToolSpec,
    ToolUseStart,
    Usage,
)
from shared.i18n import DEFAULT_LANGUAGE, translate

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from anthropic.types import (
        ContentBlockParam,
        MessageParam,
        ToolChoiceParam,
        ToolParam,
        ToolResultBlockParam,
        ToolUseBlockParam,
    )

    from infra.llm.protocols import AnthropicMessage, ContentBlock

_EMPTY_PLACEHOLDER = translate("prompts.common.emptyResponse", DEFAULT_LANGUAGE)

_ARGUMENTS_ADAPTER: TypeAdapter[JsonObject] = TypeAdapter(dict[str, JsonValue])


class RequestKwargs(TypedDict):
    model: str
    max_tokens: int
    system: str
    messages: list[MessageParam]
    tools: NotRequired[list[ToolParam]]
    tool_choice: NotRequired[ToolChoiceParam]


def _to_tool_choice(tool_choice: str) -> ToolChoiceParam:
    match tool_choice:
        case "any":
            return {"type": "any"}
        case "none":
            return {"type": "none"}
        case _:
            return {"type": "auto"}


def to_tools(tools: list[ToolSpec]) -> list[ToolParam]:
    return [
        {"name": t.name, "description": t.description, "input_schema": dict(t.input_schema)}
        for t in tools
    ]


def to_messages(messages: list[Message]) -> list[MessageParam]:
    out: list[MessageParam] = []
    pending_results: list[ToolResultBlockParam] = []

    def flush() -> None:
        if pending_results:
            out.append({"role": "user", "content": list(pending_results)})
            pending_results.clear()

    for message in messages:
        if message.role == Role.TOOL:
            pending_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": message.tool_call_id or "",
                    "content": message.content,
                }
            )
            continue

        flush()
        if message.role == Role.USER:
            content_text = message.content or _EMPTY_PLACEHOLDER
            out.append({"role": "user", "content": content_text})
        elif message.role == Role.ASSISTANT:
            content: list[ContentBlockParam] = []
            if message.content:
                content.append({"type": "text", "text": message.content})
            for call in message.tool_calls:
                tool_use: ToolUseBlockParam = {
                    "type": "tool_use",
                    "id": call.id,
                    "name": call.name,
                    "input": dict(call.arguments),
                }
                content.append(tool_use)
            if not content:
                content.append({"type": "text", "text": _EMPTY_PLACEHOLDER})
            out.append({"role": "assistant", "content": content})

    flush()
    return out


def _block_str(block: ContentBlock, field: str) -> str:
    value = getattr(block, field, "")
    return value if isinstance(value, str) else ""


def _to_arguments(raw: object) -> JsonObject:
    try:
        return _ARGUMENTS_ADAPTER.validate_python(raw)
    except ValidationError:
        return {}


def parse_message(response: AnthropicMessage) -> LLMResponse:
    text_parts: list[str] = []
    calls: list[ToolCall] = []
    for block in response.content:
        match block.type:
            case "text":
                text_parts.append(_block_str(block, "text"))
            case "tool_use":
                calls.append(
                    ToolCall(
                        id=_block_str(block, "id"),
                        name=_block_str(block, "name"),
                        arguments=_to_arguments(getattr(block, "input", None)),
                    )
                )
            case _:
                continue

    return LLMResponse(
        text="".join(text_parts),
        tool_calls=calls,
        stop_reason=response.stop_reason or "",
        usage=Usage(
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
        ),
    )


class AnthropicClient(LLMClient):
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        max_tokens: int = 4096,
        timeout: int = 60,
        max_retries: int = 3,
    ) -> None:
        from anthropic import AsyncAnthropic

        self._client = AsyncAnthropic(api_key=api_key, timeout=timeout, max_retries=max_retries)
        self._model = model
        self._max_tokens = max_tokens
        self._timeout = timeout

    @property
    def model(self) -> str:
        return self._model

    def _request_kwargs(
        self,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None,
        tool_choice: str | None,
    ) -> RequestKwargs:
        kwargs: RequestKwargs = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "system": system,
            "messages": to_messages(messages),
        }
        if tools:
            kwargs["tools"] = to_tools(tools)
        if tool_choice is not None:
            kwargs["tool_choice"] = _to_tool_choice(tool_choice)
        return kwargs

    async def complete(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> LLMResponse:
        kwargs = self._request_kwargs(system, messages, tools, tool_choice)
        response = await self._client.messages.create(**kwargs)
        return parse_message(response)

    async def stream(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> AsyncIterator[StreamEvent]:
        kwargs = self._request_kwargs(system, messages, tools, tool_choice)
        async with self._client.messages.stream(**kwargs) as stream:
            event_iterator = stream.__aiter__()
            while True:
                try:
                    event = await asyncio.wait_for(
                        event_iterator.__anext__(), timeout=self._timeout
                    )
                except StopAsyncIteration:
                    break
                if event.type == "text":
                    yield TextDelta(event.text)
                elif event.type == "content_block_start" and event.content_block.type == "tool_use":
                    yield ToolUseStart(name=event.content_block.name)
            message = await asyncio.wait_for(stream.get_final_message(), timeout=self._timeout)
        yield parse_message(message)

    async def aclose(self) -> None:
        await self._client.close()
