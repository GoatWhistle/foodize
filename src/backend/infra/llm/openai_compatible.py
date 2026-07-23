from __future__ import annotations

import asyncio
import json
from typing import TYPE_CHECKING

from openai import AsyncOpenAI, BadRequestError
from openai.types.chat import ChatCompletionMessageFunctionToolCall

from infra.llm.base import (
    JsonObject,
    LLMClient,
    LLMResponse,
    Message,
    StreamEvent,
    ToolCall,
    ToolSpec,
    Usage,
)
from infra.llm.openai_mapping import RequestKwargs, to_messages, to_tool_choice, to_tools
from infra.llm.openai_stream import OpenAIStreamAccumulator
from shared.exceptions.internal import EmptyLLMResponseError
from utils.logging_setup import get_logger

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

    from openai.types.chat import ChatCompletion
    from pydantic import JsonValue

    from infra.llm.protocols import StreamChunk

logger = get_logger("ai.openai_compatible")


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
        kwargs: RequestKwargs = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "messages": to_messages(system, messages),
        }
        if tools:
            kwargs["tools"] = to_tools(tools)
            kwargs["tool_choice"] = to_tool_choice(tool_choice)

        response: ChatCompletion = await self._client.chat.completions.create(**kwargs)
        return self._to_llm_response(response)

    def _to_llm_response(self, response: ChatCompletion) -> LLMResponse:
        if not response.choices:
            raise EmptyLLMResponseError(self._model)
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
            stop_reason=choice.finish_reason,
            usage=Usage(
                input_tokens=usage.prompt_tokens if usage else 0,
                output_tokens=usage.completion_tokens if usage else 0,
            ),
        )

    def _parse_arguments(self, tool_name: str, raw: str | None) -> JsonObject:
        try:
            parsed: JsonValue = json.loads(raw or "{}")
        except json.JSONDecodeError:
            logger.warning(
                "malformed_tool_arguments",
                model=self._model,
                tool=tool_name,
                length=len(raw or ""),
            )
            return {}
        if not isinstance(parsed, dict):
            return {}
        return parsed

    async def _create_stream(self, create_kwargs: RequestKwargs) -> AsyncIterator[StreamChunk]:
        try:
            stream = await asyncio.wait_for(
                self._client.chat.completions.create(stream=True, **create_kwargs),
                timeout=self._timeout,
            )
        except BadRequestError:
            if "stream_options" not in create_kwargs:
                raise
            logger.info("stream_options_rejected_retrying", model=self._model)
            retry_kwargs = create_kwargs.copy()
            retry_kwargs.pop("stream_options", None)
            stream = await asyncio.wait_for(
                self._client.chat.completions.create(stream=True, **retry_kwargs),
                timeout=self._timeout,
            )
        return stream

    async def stream(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> AsyncIterator[StreamEvent]:
        create_kwargs: RequestKwargs = {
            "model": self._model,
            "max_tokens": self._max_tokens,
            "messages": to_messages(system, messages),
            "stream_options": {"include_usage": True},
        }
        if tools:
            create_kwargs["tools"] = to_tools(tools)
            create_kwargs["tool_choice"] = to_tool_choice(tool_choice)

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
