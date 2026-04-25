from abc import ABC, abstractmethod


class MessagePublisher(ABC):
    @abstractmethod
    async def publish(self, routing_key: str, body: bytes) -> None: ...
