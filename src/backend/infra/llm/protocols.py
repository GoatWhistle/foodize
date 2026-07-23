from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from collections.abc import Sequence


class FunctionFragment(Protocol):
    @property
    def name(self) -> str | None: ...

    @property
    def arguments(self) -> str | None: ...


class ToolCallFragment(Protocol):
    @property
    def index(self) -> int: ...

    @property
    def id(self) -> str | None: ...

    @property
    def function(self) -> FunctionFragment | None: ...


class ChoiceDelta(Protocol):
    @property
    def content(self) -> str | None: ...

    @property
    def tool_calls(self) -> Sequence[ToolCallFragment] | None: ...


class StreamChoice(Protocol):
    @property
    def finish_reason(self) -> str | None: ...

    @property
    def delta(self) -> ChoiceDelta | None: ...


class StreamUsage(Protocol):
    @property
    def prompt_tokens(self) -> int: ...

    @property
    def completion_tokens(self) -> int: ...


class StreamChunk(Protocol):
    @property
    def choices(self) -> Sequence[StreamChoice]: ...

    @property
    def usage(self) -> StreamUsage | None: ...


class AnthropicUsage(Protocol):
    @property
    def input_tokens(self) -> int: ...

    @property
    def output_tokens(self) -> int: ...


class ContentBlock(Protocol):
    @property
    def type(self) -> str: ...


class AnthropicMessage(Protocol):
    @property
    def content(self) -> Sequence[ContentBlock]: ...

    @property
    def stop_reason(self) -> str | None: ...

    @property
    def usage(self) -> AnthropicUsage: ...
