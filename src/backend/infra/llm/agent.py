from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator, Awaitable, Callable

from infra.llm.base import LLMClient, LLMResponse, Message, Role, ToolCall, ToolSpec

logger = logging.getLogger("ai.agent")

ToolExecutor = Callable[[ToolCall], Awaitable[str]]


def _log_usage(model: str, response: LLMResponse) -> None:
    usage = response.usage
    logger.info(
        "llm_call model=%s input_tokens=%s output_tokens=%s tool_calls=%s",
        model,
        usage.input_tokens,
        usage.output_tokens,
        len(response.tool_calls),
    )


async def _run_tools(call: ToolCall, execute: ToolExecutor) -> Message:
    try:
        result = await execute(call)
    except Exception as exc:
        result = f"Error while running tool '{call.name}': {exc}"
    return Message(
        role=Role.TOOL,
        content=result,
        tool_call_id=call.id,
        tool_name=call.name,
    )


async def run_agent(
    client: LLMClient,
    *,
    system: str,
    messages: list[Message],
    tools: list[ToolSpec],
    execute: ToolExecutor,
    max_steps: int = 8,
) -> tuple[str, list[Message]]:

    history = list(messages)
    for _ in range(max_steps):
        response = await client.complete(system=system, messages=history, tools=tools)
        _log_usage(client.model, response)
        if not response.tool_calls:
            history.append(Message(role=Role.ASSISTANT, content=response.text))
            return response.text, history

        history.append(
            Message(role=Role.ASSISTANT, content=response.text, tool_calls=response.tool_calls)
        )
        tool_results = await asyncio.gather(
            *[_run_tools(call, execute) for call in response.tool_calls]
        )
        history.extend(tool_results)

    response = await client.complete(system=system, messages=history, tools=None)
    _log_usage(client.model, response)
    history.append(Message(role=Role.ASSISTANT, content=response.text))
    return response.text, history


async def stream_agent(
    client: LLMClient,
    *,
    system: str,
    messages: list[Message],
    tools: list[ToolSpec],
    execute: ToolExecutor,
    max_steps: int = 8,
) -> AsyncIterator[str]:

    history = list(messages)
    for _ in range(max_steps):
        response = await client.complete(system=system, messages=history, tools=tools)
        _log_usage(client.model, response)
        if not response.tool_calls:
            history.append(Message(role=Role.ASSISTANT, content=response.text))
            break
        history.append(
            Message(role=Role.ASSISTANT, content=response.text, tool_calls=response.tool_calls)
        )
        tool_results = await asyncio.gather(
            *[_run_tools(call, execute) for call in response.tool_calls]
        )
        history.extend(tool_results)
    else:
        response = await client.complete(system=system, messages=history, tools=None)
        _log_usage(client.model, response)
        history.append(Message(role=Role.ASSISTANT, content=response.text))

    async for chunk in client.stream_text(system=system, messages=history):
        yield chunk
