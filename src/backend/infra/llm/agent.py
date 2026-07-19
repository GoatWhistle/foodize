from __future__ import annotations

import asyncio
import logging
from collections.abc import AsyncIterator, Awaitable, Callable
from dataclasses import dataclass, field

from infra.llm.base import (
    LLMClient,
    LLMResponse,
    Message,
    Role,
    StreamEvent,
    TextDelta,
    ToolCall,
    ToolInputError,
    ToolSpec,
    ToolUseStart,
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


async def _run_tool(call: ToolCall, execute: ToolExecutor, deadline: float) -> Message:
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
    if len(calls) == 1:
        return [await _run_tool(calls[0], execute, deadline)]
    return list(await asyncio.gather(*(_run_tool(call, execute, deadline) for call in calls)))


@dataclass
class _AgentRun:
    client: LLMClient
    system: str
    history: list[Message]
    tools: list[ToolSpec]
    execute: ToolExecutor
    max_tokens: int
    deadline: float
    output_spent: int = field(default=0)

    def absorb(self, response: LLMResponse) -> bool:
        _log_usage(self.client.model, response)
        self.output_spent += response.usage.output_tokens
        total = response.usage.input_tokens + self.output_spent
        if total > self.max_tokens:
            raise LLMBudgetExceededError(
                f"token budget exceeded: total={total} max={self.max_tokens}"
            )
        return _check_truncation(self.client.model, response)

    async def complete(self, tool_choice: str | None = None) -> LLMResponse:
        return await asyncio.wait_for(
            self.client.complete(
                system=self.system,
                messages=self.history,
                tools=self.tools,
                tool_choice=tool_choice,
            ),
            timeout=_remaining(self.deadline),
        )

    async def append_tool_round(self, response: LLMResponse) -> None:
        self.history.append(
            Message(role=Role.ASSISTANT, content=response.text, tool_calls=response.tool_calls)
        )
        tool_results = await _run_all_tools(response.tool_calls, self.execute, self.deadline)
        self.history.extend(tool_results)

    async def forced_final_answer(self) -> str:
        response = await self.complete(tool_choice="none")
        truncated = self.absorb(response)
        text = response.text + (_TRUNCATED_NOTICE if truncated else _STEPS_EXHAUSTED_NOTICE)
        self.history.append(Message(role=Role.ASSISTANT, content=text))
        return text

    async def stream_round(self, tool_choice: str | None) -> AsyncIterator[StreamEvent]:
        iterator = self.client.stream(
            system=self.system, messages=self.history, tools=self.tools, tool_choice=tool_choice
        ).__aiter__()
        while True:
            try:
                event = await asyncio.wait_for(
                    iterator.__anext__(), timeout=_remaining(self.deadline)
                )
            except StopAsyncIteration:
                return
            yield event

    def missing_final_response_error(self) -> RuntimeError:
        return RuntimeError(
            "LLM stream ended without a final response "
            f"(model={self.client.model}); connection likely dropped mid-stream"
        )


def _start_run(
    client: LLMClient,
    system: str,
    messages: list[Message],
    tools: list[ToolSpec],
    execute: ToolExecutor,
    max_tokens: int,
    deadline_seconds: float,
) -> _AgentRun:
    deadline = asyncio.get_running_loop().time() + deadline_seconds
    return _AgentRun(client, system, list(messages), tools, execute, max_tokens, deadline)


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
    run = _start_run(client, system, messages, tools, execute, max_tokens, deadline_seconds)
    for _ in range(max_steps):
        response = await run.complete()
        truncated = run.absorb(response)
        if not response.tool_calls:
            text = response.text + (_TRUNCATED_NOTICE if truncated else "")
            run.history.append(Message(role=Role.ASSISTANT, content=text))
            return text, run.history
        await run.append_tool_round(response)

    logger.warning(
        "run_agent exhausted max_steps=%s, forcing final answer with tool_choice=none",
        max_steps,
    )
    return await run.forced_final_answer(), run.history


async def _stream_forced_final(run: _AgentRun) -> AsyncIterator[str]:
    emitted = False
    async for event in run.stream_round(tool_choice="none"):
        if isinstance(event, TextDelta):
            if event.text:
                emitted = True
                yield event.text
        elif isinstance(event, LLMResponse):
            run.absorb(event)
    if not emitted:
        yield _STEPS_EXHAUSTED_NOTICE


async def _stream_agent_loop(run: _AgentRun, max_steps: int) -> AsyncIterator[str]:
    for _ in range(max_steps):
        response: LLMResponse | None = None
        buffering = False
        buffered: list[str] = []
        async for event in run.stream_round(tool_choice=None):
            if isinstance(event, TextDelta):
                if not event.text:
                    continue
                if buffering:
                    buffered.append(event.text)
                else:
                    yield event.text
            elif isinstance(event, ToolUseStart):
                buffering = True
            elif isinstance(event, LLMResponse):
                response = event
        if response is None:
            raise run.missing_final_response_error()
        if buffered:
            yield "".join(buffered)
        truncated = run.absorb(response)
        if not response.tool_calls:
            if truncated:
                yield _TRUNCATED_NOTICE
            return
        await run.append_tool_round(response)

    logger.warning(
        "stream_agent exhausted max_steps=%s, forcing final answer with tool_choice=none",
        max_steps,
    )
    async for text in _stream_forced_final(run):
        yield text


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
    run = _start_run(client, system, messages, tools, execute, max_tokens, deadline_seconds)
    try:
        async for text in _stream_agent_loop(run, max_steps):
            yield text
    except Exception:
        logger.exception("stream_agent failed")
        raise
