from abc import ABC, abstractmethod

from pydantic import JsonValue


class MessagePublisher(ABC):
    @abstractmethod
    async def publish(self, routing_key: str, body: bytes | dict[str, JsonValue]) -> None: ...
