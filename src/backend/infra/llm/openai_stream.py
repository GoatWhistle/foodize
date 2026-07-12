from __future__ import annotations

from collections.abc import Callable
from typing import Any

from infra.llm.base import LLMResponse, TextDelta, ToolCall, Usage

_ArgumentsParser = Callable[[str, str | None], dict[str, Any]]


class OpenAIStreamAccumulator:
    def __init__(self) -> None:
        self._text_parts: list[str] = []
        self._calls: dict[int, dict[str, str]] = {}
        self._finish_reason = ""
        self._usage = Usage()

    @property
    def usage(self) -> Usage:
        return self._usage

    def absorb(self, chunk: Any) -> TextDelta | None:
        self._absorb_usage(chunk)
        if not chunk.choices:
            return None
        choice = chunk.choices[0]
        if choice.finish_reason:
            self._finish_reason = choice.finish_reason
        delta = choice.delta
        if delta is None:
            return None
        self._absorb_tool_calls(delta.tool_calls or [])
        if delta.content:
            self._text_parts.append(delta.content)
            return TextDelta(delta.content)
        return None

    def _absorb_usage(self, chunk: Any) -> None:
        chunk_usage = getattr(chunk, "usage", None)
        if chunk_usage is not None:
            self._usage = Usage(
                input_tokens=getattr(chunk_usage, "prompt_tokens", 0) or 0,
                output_tokens=getattr(chunk_usage, "completion_tokens", 0) or 0,
            )

    def _absorb_tool_calls(self, fragments: list[Any]) -> None:
        for fragment in fragments:
            acc = self._calls.setdefault(fragment.index, {"id": "", "name": "", "arguments": ""})
            if fragment.id:
                acc["id"] = fragment.id
            function = fragment.function
            if function is not None:
                if function.name:
                    acc["name"] = function.name
                if function.arguments:
                    acc["arguments"] += function.arguments

    def build_response(self, parse_arguments: _ArgumentsParser) -> LLMResponse:
        calls = [
            ToolCall(
                id=acc["id"] or f"call_{index}",
                name=acc["name"],
                arguments=parse_arguments(acc["name"], acc["arguments"]),
            )
            for index, acc in sorted(self._calls.items())
        ]
        return LLMResponse(
            text="".join(self._text_parts),
            tool_calls=calls,
            stop_reason=self._finish_reason,
            usage=self._usage,
        )
