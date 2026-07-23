from __future__ import annotations

import json
from typing import TYPE_CHECKING, NotRequired, TypedDict

from infra.llm.base import Message, Role, ToolSpec
from shared.i18n import DEFAULT_LANGUAGE, translate

if TYPE_CHECKING:
    from openai.types.chat import (
        ChatCompletionMessageParam,
        ChatCompletionStreamOptionsParam,
        ChatCompletionToolChoiceOptionParam,
        ChatCompletionToolUnionParam,
    )

EMPTY_PLACEHOLDER = translate("prompts.common.emptyResponse", DEFAULT_LANGUAGE)


class RequestKwargs(TypedDict):
    model: str
    max_tokens: int
    messages: list[ChatCompletionMessageParam]
    tools: NotRequired[list[ChatCompletionToolUnionParam]]
    tool_choice: NotRequired[ChatCompletionToolChoiceOptionParam]
    stream_options: NotRequired[ChatCompletionStreamOptionsParam]


def to_tool_choice(tool_choice: str | None) -> ChatCompletionToolChoiceOptionParam:
    match tool_choice:
        case "none":
            return "none"
        case "required":
            return "required"
        case _:
            return "auto"


def to_tools(tools: list[ToolSpec]) -> list[ChatCompletionToolUnionParam]:
    return [
        {
            "type": "function",
            "function": {
                "name": t.name,
                "description": t.description,
                "parameters": dict(t.input_schema),
            },
        }
        for t in tools
    ]


def _assistant_message(message: Message) -> ChatCompletionMessageParam:
    if message.tool_calls:
        return {
            "role": "assistant",
            "content": message.content or None,
            "tool_calls": [
                {
                    "id": call.id,
                    "type": "function",
                    "function": {
                        "name": call.name,
                        "arguments": json.dumps(call.arguments, ensure_ascii=False),
                    },
                }
                for call in message.tool_calls
            ],
        }
    return {"role": "assistant", "content": message.content or EMPTY_PLACEHOLDER}


def to_messages(system: str, messages: list[Message]) -> list[ChatCompletionMessageParam]:
    out: list[ChatCompletionMessageParam] = [{"role": "system", "content": system}]
    for message in messages:
        if message.role == Role.USER:
            out.append({"role": "user", "content": message.content or EMPTY_PLACEHOLDER})
        elif message.role == Role.ASSISTANT:
            out.append(_assistant_message(message))
        elif message.role == Role.TOOL:
            out.append(
                {
                    "role": "tool",
                    "tool_call_id": message.tool_call_id or "",
                    "content": message.content or EMPTY_PLACEHOLDER,
                }
            )
    return out
