from __future__ import annotations

import asyncio
import json
from typing import TYPE_CHECKING, Any, cast

from openai import AsyncOpenAI, BadRequestError
from openai.types.chat import ChatCompletionMessageFunctionToolCall

from infra.llm.base import (
    LLMClient,
    LLMResponse,
    Message,
    Role,
    StreamEvent,
    ToolCall,
    ToolSpec,
    Usage,
)
from infra.llm.openai_stream import OpenAIStreamAccumulator
from shared.i18n import DEFAULT_LANGUAGE, translate
from utils.logging_setup import get_logger

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from openai.types.chat import ChatCompletion

logger = get_logger("ai.openai_compatible")

_EMPTY_PLACEHOLDER = translate("prompts.common.emptyResponse", DEFAULT_LANGUAGE)


def _to_tools(tools: list[ToolSpec]) -> list[dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": t.name,
                "description": t.description,
                "parameters": t.input_schema,
            },
        }
        for t in tools
    ]


def _to_messages(system: str, messages: list[Message]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = [{"role": "system", "content": system}]
    for message in messages:
        if message.role == Role.USER:
            out.append({"role": "user", "content": message.content or _EMPTY_PLACEHOLDER})
        elif message.role == Role.ASSISTANT:
            entry: dict[str, Any] = {"role": "assistant", "content": message.content or None}
            if message.tool_calls:
                entry["tool_calls"] = [
                    {
                        "id": call.id,
                        "type": "function",
                        "function": {
                            "name": call.name,
                            "arguments": json.dumps(call.arguments, ensure_ascii=False),
                        },
                    }
                    for call in message.tool_calls
                ]
            elif entry["content"] is None:
                entry["content"] = _EMPTY_PLACEHOLDER
            out.append(entry)
        elif message.role == Role.TOOL:
            out.append(
                {
                    "role": "tool",
                    "tool_call_id": message.tool_call_id,
                    "content": message.content or _EMPTY_PLACEHOLDER,
                }
            )
    return out


class OpenAICompatibleClient(LLMClient):
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        base_url: str | None = None,
        max_tokens: int = 4096,
        timeout: int = 60,
        max_retries: int = 3,
    ) -> None:
        self._client = AsyncOpenAI(
            api_key=api_key or "not-needed",
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
        )
        self._model = model
        self._max_tokens = max_tokens
        self._timeout = timeout

    @property
    def model(self) -> str:
        return self._model

    async def complete(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> LLMResponse:
        kwargs: dict[str, Any] = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "messages": _to_messages(system, messages),
        }
        if tools:
            kwargs["tools"] = _to_tools(tools)
            kwargs["tool_choice"] = tool_choice or "auto"

        response = await self._client.chat.completions.create(**kwargs)
        return self._to_llm_response(response)

    def _to_llm_response(self, response: ChatCompletion) -> LLMResponse:
        if not response.choices:
            raise RuntimeError(f"LLM returned empty choices (model={self._model})")
        choice = response.choices[0]
        message = choice.message

        calls = [
            ToolCall(
                id=tool_call.id,
                name=tool_call.function.name,
                arguments=self._parse_arguments(
                    tool_call.function.name, tool_call.function.arguments
                ),
            )
            for tool_call in message.tool_calls or []
            if isinstance(tool_call, ChatCompletionMessageFunctionToolCall)
        ]

        usage = response.usage
        return LLMResponse(
            text=message.content or "",
            tool_calls=calls,
            stop_reason=choice.finish_reason or "",
            usage=Usage(
                input_tokens=getattr(usage, "prompt_tokens", 0) or 0,
                output_tokens=getattr(usage, "completion_tokens", 0) or 0,
            ),
        )

    def _parse_arguments(self, tool_name: str, raw: str | None) -> dict[str, Any]:
        try:
            return cast("dict[str, Any]", json.loads(raw or "{}"))
        except json.JSONDecodeError:
            logger.warning(
                "malformed_tool_arguments",
                model=self._model,
                tool=tool_name,
                length=len(raw or ""),
            )
            return {}

    async def _create_stream(self, create_kwargs: dict[str, Any]) -> AsyncIterator[Any]:
        try:
            stream = await asyncio.wait_for(
                self._client.chat.completions.create(**create_kwargs),
                timeout=self._timeout,
            )
        except BadRequestError:
            if "stream_options" not in create_kwargs:
                raise
            logger.info("stream_options_rejected_retrying", model=self._model)
            create_kwargs = {k: v for k, v in create_kwargs.items() if k != "stream_options"}
            stream = await asyncio.wait_for(
                self._client.chat.completions.create(**create_kwargs),
                timeout=self._timeout,
            )
        return cast("AsyncIterator[Any]", stream)

    async def stream(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> AsyncIterator[StreamEvent]:
        create_kwargs: dict[str, Any] = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "messages": _to_messages(system, messages),
            "stream": True,
            "stream_options": {"include_usage": True},
        }
        if tools:
            create_kwargs["tools"] = _to_tools(tools)
            create_kwargs["tool_choice"] = tool_choice or "auto"

        stream = await self._create_stream(create_kwargs)

        accumulator = OpenAIStreamAccumulator()
        iterator = stream.__aiter__()
        while True:
            try:
                chunk = await asyncio.wait_for(iterator.__anext__(), timeout=self._timeout)
            except StopAsyncIteration:
                break
            for event in accumulator.absorb(chunk):
                yield event

        usage = accumulator.usage
        if usage.input_tokens == 0 and usage.output_tokens == 0:
            logger.warning("stream_usage_missing", model=self._model)
        yield accumulator.build_response(self._parse_arguments)

    async def aclose(self) -> None:
        await self._client.close()
