import uuid
from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class DomainEvent(Protocol):
    event_type: str
    event_id: uuid.UUID

    def model_dump(self, *args: Any, **kwargs: Any) -> dict[str, Any]: ...
