from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator, Awaitable, Callable

from infra.llm.base import (
    LLMClient,
    LLMResponse,
    Message,
    Role,
    ToolCall,
    ToolInputError,
    ToolSpec,
)

logger = logging.getLogger("ai.agent")

ToolExecutor = Callable[[ToolCall], Awaitable[str]]

_DEFAULT_MAX_TOKENS = 200_000
_DEFAULT_DEADLINE_SECONDS = 120.0
_TRUNCATED_STOP_REASONS = frozenset({"max_tokens", "length"})
_TRUNCATED_NOTICE = "\n\n_(ответ был обрезан из-за лимита длины — уточните запрос)_"
_STEPS_EXHAUSTED_NOTICE = (
    "\n\n_(не удалось полностью завершить за отведённое число шагов — уточните запрос)_"
)


class LLMBudgetExceededError(Exception):
    pass


class LLMDeadlineExceededError(Exception):
    pass


def _remaining(deadline: float) -> float:
    remaining = deadline - asyncio.get_running_loop().time()
    if remaining <= 0:
        raise LLMDeadlineExceededError("LLM agent session deadline exceeded")
    return remaining


def _log_usage(model: str, response: LLMResponse) -> None:
    usage = response.usage
    logger.info(
        "llm_call model=%s input_tokens=%s output_tokens=%s tool_calls=%s",
        model,
        usage.input_tokens,
        usage.output_tokens,
        len(response.tool_calls),
    )


def _check_truncation(model: str, response: LLMResponse) -> bool:
    if response.stop_reason in _TRUNCATED_STOP_REASONS:
        logger.warning(
            "llm response truncated model=%s stop_reason=%s output_tokens=%s",
            model,
            response.stop_reason,
            response.usage.output_tokens,
        )
        return True
    return False


def _account(output_spent: int, response: LLMResponse, max_tokens: int) -> int:
    output_spent += response.usage.output_tokens
    total = response.usage.input_tokens + output_spent
    if total > max_tokens:
        raise LLMBudgetExceededError(f"token budget exceeded: total={total} max={max_tokens}")
    return output_spent


async def _run_tools(call: ToolCall, execute: ToolExecutor, deadline: float) -> Message:
    try:
        result = await asyncio.wait_for(execute(call), timeout=_remaining(deadline))
    except ToolInputError as exc:
        result = f"Error while running tool '{call.name}': {exc}"
    except (TimeoutError, LLMDeadlineExceededError):
        raise
    except Exception:
        logger.exception("tool '%s' failed", call.name)
        result = f"Error while running tool '{call.name}': internal error"
    return Message(
        role=Role.TOOL,
        content=result,
        tool_call_id=call.id,
        tool_name=call.name,
    )


async def _run_all_tools(
    calls: list[ToolCall], execute: ToolExecutor, deadline: float
) -> list[Message]:
    results: list[Message] = []
    for call in calls:
        results.append(await _run_tools(call, execute, deadline))
    return results


async def run_agent(
    client: LLMClient,
    *,
    system: str,
    messages: list[Message],
    tools: list[ToolSpec],
    execute: ToolExecutor,
    max_steps: int = 8,
    max_tokens: int = _DEFAULT_MAX_TOKENS,
    deadline_seconds: float = _DEFAULT_DEADLINE_SECONDS,
) -> tuple[str, list[Message]]:

    history = list(messages)
    output_spent = 0
    deadline = asyncio.get_running_loop().time() + deadline_seconds
    for _ in range(max_steps):
        response = await asyncio.wait_for(
            client.complete(system=system, messages=history, tools=tools),
            timeout=_remaining(deadline),
        )
        _log_usage(client.model, response)
        truncated = _check_truncation(client.model, response)
        output_spent = _account(output_spent, response, max_tokens)
        if not response.tool_calls:
            text = response.text + (_TRUNCATED_NOTICE if truncated else "")
            history.append(Message(role=Role.ASSISTANT, content=text))
            return text, history

        history.append(
            Message(role=Role.ASSISTANT, content=response.text, tool_calls=response.tool_calls)
        )
        tool_results = await _run_all_tools(response.tool_calls, execute, deadline)
        history.extend(tool_results)

    logger.warning(
        "run_agent exhausted max_steps=%s, forcing final answer with tool_choice=none",
        max_steps,
    )
    response = await asyncio.wait_for(
        client.complete(system=system, messages=history, tools=tools, tool_choice="none"),
        timeout=_remaining(deadline),
    )
    _log_usage(client.model, response)
    truncated = _check_truncation(client.model, response)
    text = response.text + (_TRUNCATED_NOTICE if truncated else _STEPS_EXHAUSTED_NOTICE)
    history.append(Message(role=Role.ASSISTANT, content=text))
    return text, history


async def stream_agent(
    client: LLMClient,
    *,
    system: str,
    messages: list[Message],
    tools: list[ToolSpec],
    execute: ToolExecutor,
    max_steps: int = 8,
    max_tokens: int = _DEFAULT_MAX_TOKENS,
    deadline_seconds: float = _DEFAULT_DEADLINE_SECONDS,
) -> AsyncIterator[str]:
    try:
        history = list(messages)
        output_spent = 0
        deadline = asyncio.get_running_loop().time() + deadline_seconds
        for _ in range(max_steps):
            response = await asyncio.wait_for(
                client.complete(system=system, messages=history, tools=tools),
                timeout=_remaining(deadline),
            )
            _log_usage(client.model, response)
            truncated = _check_truncation(client.model, response)
            output_spent = _account(output_spent, response, max_tokens)
            if not response.tool_calls:
                yield response.text
                if truncated:
                    yield _TRUNCATED_NOTICE
                return
            if response.text:
                yield response.text
            history.append(
                Message(role=Role.ASSISTANT, content=response.text, tool_calls=response.tool_calls)
            )
            tool_results = await _run_all_tools(response.tool_calls, execute, deadline)
            history.extend(tool_results)

        logger.warning(
            "stream_agent exhausted max_steps=%s, forcing final answer with tool_choice=none",
            max_steps,
        )
        emitted = False
        async for chunk in client.stream_text(
            system=system, messages=history, tools=tools, tool_choice="none"
        ):
            emitted = True
            yield chunk
        if not emitted:
            yield _STEPS_EXHAUSTED_NOTICE
    except Exception:
        logger.exception("stream_agent failed")
        raise
