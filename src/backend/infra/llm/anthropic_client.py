from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, Any

from infra.llm.base import (
    LLMClient,
    LLMResponse,
    Message,
    Role,
    StreamEvent,
    TextDelta,
    ToolCall,
    ToolSpec,
    Usage,
)

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

_EMPTY_PLACEHOLDER = "(пустой ответ)"


def _to_tools(tools: list[ToolSpec]) -> list[dict[str, Any]]:
    return [
        {"name": t.name, "description": t.description, "input_schema": t.input_schema}
        for t in tools
    ]


def _to_messages(messages: list[Message]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    pending_results: list[dict[str, Any]] = []

    def flush() -> None:
        if pending_results:
            out.append({"role": "user", "content": list(pending_results)})
            pending_results.clear()

    for message in messages:
        if message.role == Role.TOOL:
            pending_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": message.tool_call_id,
                    "content": message.content,
                }
            )
            continue

        flush()
        if message.role == Role.USER:
            content_text = message.content or _EMPTY_PLACEHOLDER
            out.append({"role": "user", "content": content_text})
        elif message.role == Role.ASSISTANT:
            content: list[dict[str, Any]] = []
            if message.content:
                content.append({"type": "text", "text": message.content})
            for call in message.tool_calls:
                content.append(
                    {"type": "tool_use", "id": call.id, "name": call.name, "input": call.arguments}
                )
            if not content:
                content.append({"type": "text", "text": _EMPTY_PLACEHOLDER})
            out.append({"role": "assistant", "content": content})

    flush()
    return out


def _parse_message(response: Any) -> LLMResponse:
    text_parts: list[str] = []
    calls: list[ToolCall] = []
    for block in response.content:
        if block.type == "text":
            text_parts.append(block.text)
        elif block.type == "tool_use":
            calls.append(ToolCall(id=block.id, name=block.name, arguments=dict(block.input or {})))

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
    ) -> dict[str, Any]:
        kwargs: dict[str, Any] = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "system": system,
            "messages": _to_messages(messages),
        }
        if tools:
            kwargs["tools"] = _to_tools(tools)
        if tool_choice is not None:
            kwargs["tool_choice"] = {"type": tool_choice}
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
        return _parse_message(response)

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
            text_iterator = stream.text_stream.__aiter__()
            while True:
                try:
                    text = await asyncio.wait_for(text_iterator.__anext__(), timeout=self._timeout)
                except StopAsyncIteration:
                    break
                yield TextDelta(text)
            message = await asyncio.wait_for(stream.get_final_message(), timeout=self._timeout)
        yield _parse_message(message)

    async def aclose(self) -> None:
        await self._client.close()
