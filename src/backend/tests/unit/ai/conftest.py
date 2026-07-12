from collections.abc import AsyncIterator
from typing import Any

from infra.llm.base import LLMClient, LLMResponse, Message, StreamEvent, TextDelta, ToolSpec


class FakeLLMClient(LLMClient):
    def __init__(
        self,
        responses: list[LLMResponse],
        delta_size: int = 2,
    ) -> None:
        self._responses = list(responses)
        self._delta_size = delta_size
        self.complete_calls: list[dict[str, Any]] = []
        self.stream_calls: list[dict[str, Any]] = []

    @property
    def model(self) -> str:
        return "fake-model"

    async def complete(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> LLMResponse:
        self.complete_calls.append(
            {
                "system": system,
                "messages": list(messages),
                "tools": tools,
                "tool_choice": tool_choice,
            }
        )
        return self._responses.pop(0)

    async def stream(
        self,
        *,
        system: str,
        messages: list[Message],
        tools: list[ToolSpec] | None = None,
        tool_choice: str | None = None,
    ) -> AsyncIterator[StreamEvent]:
        self.stream_calls.append(
            {
                "system": system,
                "messages": list(messages),
                "tools": tools,
                "tool_choice": tool_choice,
            }
        )
        response = self._responses.pop(0)
        text = response.text
        for start in range(0, len(text), self._delta_size):
            yield TextDelta(text[start : start + self._delta_size])
        yield response

    async def aclose(self) -> None:
        return None
