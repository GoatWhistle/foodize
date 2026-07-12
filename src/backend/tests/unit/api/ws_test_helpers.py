import json
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any
from unittest.mock import AsyncMock, MagicMock

from fastapi import WebSocketDisconnect


class FakeWebSocket:
    def __init__(self) -> None:
        self.sent: list[str] = []
        self.accepted = False
        self.closed = False
        self.close_code: int | None = None

    async def accept(self) -> None:
        self.accepted = True

    async def send_text(self, payload: str) -> None:
        self.sent.append(payload)

    async def send_json(self, payload: dict[str, Any]) -> None:
        self.sent.append(json.dumps(payload))

    async def receive_text(self) -> str:
        raise WebSocketDisconnect

    async def close(self, code: int = 1000) -> None:
        self.closed = True
        self.close_code = code

    def messages(self) -> list[dict[str, Any]]:
        return [json.loads(item) for item in self.sent]

    def first_message(self) -> dict[str, Any]:
        result: dict[str, Any] = json.loads(self.sent[0])
        return result


def _empty_pubsub() -> AsyncMock:
    async def _listen() -> AsyncGenerator[None]:
        return
        yield

    pubsub = AsyncMock()
    pubsub.subscribe = AsyncMock()
    pubsub.unsubscribe = AsyncMock()
    pubsub.aclose = AsyncMock()
    pubsub.get_message = AsyncMock(return_value=None)
    pubsub.listen = MagicMock(side_effect=_listen)
    return pubsub


def make_redis_cache(pubsub: AsyncMock | None = None) -> AsyncMock:
    redis_client = MagicMock()
    redis_client.pubsub = MagicMock(return_value=pubsub or _empty_pubsub())
    cache = AsyncMock()
    cache.exists = AsyncMock(return_value=False)
    cache.get_raw_client = MagicMock(return_value=redis_client)
    return cache


@asynccontextmanager
async def fake_session_ctx() -> AsyncGenerator[AsyncMock]:
    yield AsyncMock()
