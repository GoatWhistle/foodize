import asyncio
import json
from collections.abc import AsyncIterator, Awaitable, Callable, Coroutine
from contextlib import asynccontextmanager, suppress

from fastapi import WebSocket, WebSocketDisconnect
from pydantic import JsonValue
from redis.asyncio.client import PubSub
from uvicorn.protocols.utils import ClientDisconnected

from database import db_helper
from features.notifications.ws_auth import extract_ws_token, resolve_ws_token_user_id
from features.users.dependencies import get_user_by_id
from features.users.models import User
from infra.cache.redis import get_redis_cache
from utils.logging_setup import get_logger

_logger = get_logger(__name__)

MAX_WS_MESSAGE_BYTES = 4096
WS_MAX_MESSAGES_PER_WINDOW = 30
WS_WINDOW_SECONDS = 10.0
WS_SEND_TIMEOUT_SECONDS = 15.0


async def safe_send_text(websocket: WebSocket, payload: str) -> None:
    try:
        await asyncio.wait_for(websocket.send_text(payload), timeout=WS_SEND_TIMEOUT_SECONDS)
    except (WebSocketDisconnect, ClientDisconnected):
        raise WebSocketDisconnect from None
    except TimeoutError as exc:
        _logger.warning("WS send timed out; closing slow client")
        raise WebSocketDisconnect from exc


async def safe_send_json(websocket: WebSocket, payload: dict[str, JsonValue]) -> None:
    await safe_send_text(websocket, json.dumps(payload))


async def authenticate_ws_user(websocket: WebSocket, token: str | None) -> User | None:
    token = await extract_ws_token(websocket, token)
    if not token:
        await safe_send_text(websocket, json.dumps({"error": "not_authenticated"}))
        await websocket.close()
        return None

    try:
        parsed_user_id = await resolve_ws_token_user_id(token)
    except PermissionError:
        await safe_send_text(websocket, json.dumps({"error": "token_revoked"}))
        await websocket.close()
        return None
    if parsed_user_id is None:
        await safe_send_text(websocket, json.dumps({"error": "invalid_token"}))
        await websocket.close()
        return None

    async with db_helper.session_factory() as session:
        user = await get_user_by_id(session, parsed_user_id)
        if user is None or not user.is_active:
            await safe_send_text(websocket, json.dumps({"error": "not_authenticated"}))
            await websocket.close()
            return None
        return user


async def consume_client_messages(websocket: WebSocket) -> None:
    window_start = asyncio.get_running_loop().time()
    message_count = 0
    try:
        while True:
            client_message = await websocket.receive_text()

            now = asyncio.get_running_loop().time()
            if now - window_start >= WS_WINDOW_SECONDS:
                window_start = now
                message_count = 0
            message_count += 1
            if message_count > WS_MAX_MESSAGES_PER_WINDOW:
                await safe_send_text(websocket, json.dumps({"error": "rate_limited"}))
                await websocket.close(code=1008)
                return

            if len(client_message.encode("utf-8")) > MAX_WS_MESSAGE_BYTES:
                await safe_send_text(websocket, json.dumps({"error": "message_too_large"}))
                continue

            try:
                client_data = json.loads(client_message)
                if client_data.get("type") == "ping":
                    await safe_send_text(websocket, json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        pass


async def run_ws_tasks(*coros: Coroutine[object, object, None]) -> None:
    tasks = [asyncio.create_task(coro) for coro in coros]
    try:
        done, pending = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
    except asyncio.CancelledError:
        for task in tasks:
            task.cancel()
        raise
    for task in pending:
        task.cancel()
    for task in done:
        if not task.cancelled() and task.exception() is not None:
            _logger.exception("WS task failed", exc_info=task.exception())


async def close_pubsub(pubsub: PubSub) -> None:
    closer: Callable[[], Awaitable[None]] = pubsub.aclose
    await closer()


@asynccontextmanager
async def subscribed_pubsub(channel: str) -> AsyncIterator[PubSub]:
    pubsub = get_redis_cache().get_raw_client().pubsub()
    await pubsub.subscribe(channel)
    try:
        yield pubsub
    finally:
        await pubsub.unsubscribe(channel)
        await close_pubsub(pubsub)


async def run_channel_ws(
    websocket: WebSocket,
    channel: str,
    make_producer: Callable[[PubSub], Coroutine[object, object, None]],
) -> None:
    async with subscribed_pubsub(channel) as pubsub:
        with suppress(WebSocketDisconnect):
            await run_ws_tasks(make_producer(pubsub), consume_client_messages(websocket))
