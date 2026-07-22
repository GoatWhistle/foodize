from typing import Literal

from pydantic import BaseModel, Field, model_validator

from features.ai_order_agent.exceptions import OrderAgentContentTooLargeError

_MAX_TOTAL_CONTENT_CHARS = 20_000


class OrderChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class OrderChatRequest(BaseModel):
    messages: list[OrderChatMessageIn] = Field(min_length=1, max_length=40)

    @model_validator(mode="after")
    def check_total_content_size(self) -> "OrderChatRequest":
        total = sum(len(m.content) for m in self.messages)
        if total > _MAX_TOTAL_CONTENT_CHARS:
            raise OrderAgentContentTooLargeError(limit=_MAX_TOTAL_CONTENT_CHARS)
        return self
