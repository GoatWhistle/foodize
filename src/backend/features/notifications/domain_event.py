import uuid
from typing import Protocol, runtime_checkable

from pydantic import JsonValue


@runtime_checkable
class DomainEvent(Protocol):
    event_type: str
    event_id: uuid.UUID

    def model_dump(self, *, mode: str = ...) -> dict[str, JsonValue]: ...
