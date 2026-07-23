from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from infra.llm.agent_run import (
    AgentRun,
    ToolExecutor,
    start_run,
    steps_exhausted_notice,
    truncated_notice,
)
from infra.llm.base import (
    LLMClient,
    LLMResponse,
    Message,
    Role,
    TextDelta,
    ToolSpec,
    ToolUseStart,
)
from shared.i18n import DEFAULT_LANGUAGE

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

logger = logging.getLogger("ai.agent")

_DEFAULT_MAX_TOKENS = 200_000
_DEFAULT_DEADLINE_SECONDS = 120.0


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
    language: str = DEFAULT_LANGUAGE,
) -> tuple[str, list[Message]]:
    run = start_run(
        client, system, messages, tools, execute, max_tokens, deadline_seconds, language
    )
    for _ in range(max_steps):
        response = await run.complete()
        truncated = run.absorb(response)
        if not response.tool_calls:
            text = response.text + (truncated_notice(language) if truncated else "")
            run.history.append(Message(role=Role.ASSISTANT, content=text))
            return text, run.history
        await run.append_tool_round(response)

    logger.warning(
        "run_agent exhausted max_steps=%s, forcing final answer with tool_choice=none",
        max_steps,
    )
    return await run.forced_final_answer(), run.history


async def _stream_forced_final(run: AgentRun) -> AsyncIterator[str]:
    emitted = False
    async for event in run.stream_round(tool_choice="none"):
        if isinstance(event, TextDelta):
            if event.text:
                emitted = True
                yield event.text
        elif isinstance(event, LLMResponse):
            run.absorb(event)
    if not emitted:
        yield steps_exhausted_notice(run.language)


async def _stream_agent_loop(run: AgentRun, max_steps: int) -> AsyncIterator[str]:
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
                yield truncated_notice(run.language)
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
    language: str = DEFAULT_LANGUAGE,
) -> AsyncIterator[str]:
    run = start_run(
        client, system, messages, tools, execute, max_tokens, deadline_seconds, language
    )
    try:
        async for text in _stream_agent_loop(run, max_steps):
            yield text
    except Exception:
        logger.exception("stream_agent failed")
        raise
