from collections.abc import AsyncIterator
from types import SimpleNamespace

from infra.llm.base import LLMResponse, TextDelta
from infra.llm.openai_compatible import OpenAICompatibleClient


def _chunk(
    content: str | None = None,
    tool_calls: list[SimpleNamespace] | None = None,
    finish_reason: str | None = None,
    usage: SimpleNamespace | None = None,
    with_choice: bool = True,
) -> SimpleNamespace:
    delta = SimpleNamespace(content=content, tool_calls=tool_calls)
    choice = SimpleNamespace(delta=delta, finish_reason=finish_reason)
    return SimpleNamespace(choices=[choice] if with_choice else [], usage=usage)


def _fragment(
    index: int,
    id: str | None = None,
    name: str | None = None,
    arguments: str | None = None,
) -> SimpleNamespace:
    return SimpleNamespace(
        index=index,
        id=id,
        function=SimpleNamespace(name=name, arguments=arguments),
    )


class _FakeCompletions:
    def __init__(self, chunks: list[SimpleNamespace]) -> None:
        self._chunks = chunks
        self.kwargs: dict[str, object] | None = None

    async def create(self, **kwargs: object) -> AsyncIterator[SimpleNamespace]:
        self.kwargs = kwargs

        async def _iter() -> AsyncIterator[SimpleNamespace]:
            for chunk in self._chunks:
                yield chunk

        return _iter()


def _client(chunks: list[SimpleNamespace]) -> tuple[OpenAICompatibleClient, _FakeCompletions]:
    client = OpenAICompatibleClient(api_key="k", model="m")
    fake = _FakeCompletions(chunks)
    object.__setattr__(client, "_client", SimpleNamespace(chat=SimpleNamespace(completions=fake)))
    return client, fake


async def test_openai_stream_accumulates_text_tool_calls_and_usage() -> None:
    chunks = [
        _chunk(content="Ищу"),
        _chunk(content=" пиццу"),
        _chunk(tool_calls=[_fragment(0, id="call-1", name="search", arguments='{"q":')]),
        _chunk(tool_calls=[_fragment(0, arguments=' "pizza"}')]),
        _chunk(finish_reason="tool_calls"),
        _chunk(with_choice=False, usage=SimpleNamespace(prompt_tokens=11, completion_tokens=7)),
    ]
    client, fake = _client(chunks)

    events = [event async for event in client.stream(system="s", messages=[])]

    deltas = [event.text for event in events if isinstance(event, TextDelta)]
    final = events[-1]
    assert deltas == ["Ищу", " пиццу"]
    assert isinstance(final, LLMResponse)
    assert final.text == "Ищу пиццу"
    assert final.stop_reason == "tool_calls"
    assert final.usage.input_tokens == 11
    assert final.usage.output_tokens == 7
    assert len(final.tool_calls) == 1
    call = final.tool_calls[0]
    assert call.id == "call-1"
    assert call.name == "search"
    assert call.arguments == {"q": "pizza"}
    assert fake.kwargs is not None
    assert fake.kwargs["stream"] is True
    assert fake.kwargs["stream_options"] == {"include_usage": True}


async def test_openai_stream_orders_parallel_tool_calls_by_index() -> None:
    chunks = [
        _chunk(
            tool_calls=[
                _fragment(1, id="call-b", name="remove", arguments="{}"),
                _fragment(0, id="call-a", name="add", arguments="{}"),
            ]
        ),
        _chunk(finish_reason="tool_calls"),
    ]
    client, _ = _client(chunks)

    events = [event async for event in client.stream(system="s", messages=[])]

    final = events[-1]
    assert isinstance(final, LLMResponse)
    assert [call.name for call in final.tool_calls] == ["add", "remove"]


async def test_openai_stream_malformed_arguments_become_empty_dict() -> None:
    chunks = [
        _chunk(tool_calls=[_fragment(0, id="c", name="search", arguments="{oops")]),
        _chunk(finish_reason="tool_calls"),
    ]
    client, _ = _client(chunks)

    events = [event async for event in client.stream(system="s", messages=[])]

    final = events[-1]
    assert isinstance(final, LLMResponse)
    assert final.tool_calls[0].arguments == {}
