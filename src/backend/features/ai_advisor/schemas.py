import uuid
from typing import Literal

from pydantic import BaseModel, Field, model_validator

_MAX_TOTAL_CONTENT_CHARS = 20_000


class ChatMessageIn(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AdvisorChatRequest(BaseModel):
    messages: list[ChatMessageIn] = Field(min_length=1, max_length=40)
    restaurant_id: uuid.UUID | None = None

    @model_validator(mode="after")
    def check_total_content_size(self) -> "AdvisorChatRequest":
        total = sum(len(m.content) for m in self.messages)
        if total > _MAX_TOTAL_CONTENT_CHARS:
            raise ValueError(f"Total message content exceeds {_MAX_TOTAL_CONTENT_CHARS} characters")
        return self


class AdvisorInsightsResponse(BaseModel):
    insights: str
    cached: bool
