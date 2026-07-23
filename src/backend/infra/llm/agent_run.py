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
    ToolCall,
    ToolInputError,
    ToolSpec,
)
from shared.i18n import DEFAULT_LANGUAGE, translate

logger = logging.getLogger("ai.agent")

ToolExecutor = Callable[[ToolCall], Awaitable[str]]

_TRUNCATED_STOP_REASONS = frozenset({"max_tokens", "length"})


def truncated_notice(language: str) -> str:
    return translate("prompts.common.truncatedNotice", language)


def steps_exhausted_notice(language: str) -> str:
    return translate("prompts.common.stepsExhaustedNotice", language)


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
class AgentRun:
    client: LLMClient
    system: str
    history: list[Message]
    tools: list[ToolSpec]
    execute: ToolExecutor
    max_tokens: int
    deadline: float
    language: str = field(default=DEFAULT_LANGUAGE)
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
        notice = (
            truncated_notice(self.language) if truncated else steps_exhausted_notice(self.language)
        )
        text = response.text + notice
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


def start_run(
    client: LLMClient,
    system: str,
    messages: list[Message],
    tools: list[ToolSpec],
    execute: ToolExecutor,
    max_tokens: int,
    deadline_seconds: float,
    language: str,
) -> AgentRun:
    deadline = asyncio.get_running_loop().time() + deadline_seconds
    return AgentRun(client, system, list(messages), tools, execute, max_tokens, deadline, language)
